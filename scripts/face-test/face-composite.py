#!/usr/bin/env python3
"""
face-composite.py

Estrategia "face transplant":
1. Detectar el rostro en la imagen original (OpenCV Haar cascade — no requiere GPU ni modelos pesados)
2. Detectar el rostro en la imagen generada por IA
3. Recortar el rostro original, redimensionarlo al tamaño del rostro generado
4. Componer: reemplazar la cara generada por la cara original
5. Aplicar tratamiento B&N uniforme para integrar todo
6. Output final

Uso:
    python3 face-composite.py <original.jpg> <generated_body.png> <output.png>
"""
import sys
import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageOps

def detect_face(img_gray):
    """Detectar rostro con Haar cascade."""
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    cascade = cv2.CascadeClassifier(cascade_path)
    faces = cascade.detectMultiScale(
        img_gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80)
    )
    if len(faces) == 0:
        return None
    # Tomar la cara más grande
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    return faces[0]

def feather_paste(base, top, box, feather=8):
    """Pegar 'top' en 'base' en posición 'box' con borde difuminado."""
    # Crear máscara con gradiente en los bordes
    mask = Image.new('L', top.size, 255)
    # Aplicar blur a la máscara para suavizar bordes
    mask = mask.filter(ImageFilter.GaussianBlur(radius=feather))
    base.paste(top, box, mask)

def main():
    if len(sys.argv) != 4:
        print(f"Uso: {sys.argv[0]} <original> <generated> <output>")
        sys.exit(1)

    orig_path = sys.argv[1]
    gen_path = sys.argv[2]
    out_path = sys.argv[3]

    print(f"  📷 Original: {orig_path}")
    print(f"  🎨 Generada: {gen_path}")

    # 1. Cargar imágenes
    orig_color = cv2.imread(orig_path)
    gen_color = cv2.imread(gen_path)

    if orig_color is None:
        print(f"  ❌ No se pudo cargar original")
        sys.exit(1)
    if gen_color is None:
        print(f"  ❌ No se pudo cargar generada")
        sys.exit(1)

    print(f"  Original size: {orig_color.shape}")
    print(f"  Generada size: {gen_color.shape}")

    # 2. Detectar rostros
    orig_gray = cv2.cvtColor(orig_color, cv2.COLOR_BGR2GRAY)
    gen_gray = cv2.cvtColor(gen_color, cv2.COLOR_BGR2GRAY)

    orig_face = detect_face(orig_gray)
    gen_face = detect_face(gen_gray)

    if orig_face is None:
        print(f"  ❌ No se detectó rostro en original")
        sys.exit(1)
    if gen_face is None:
        print(f"  ❌ No se detectó rostro en generada — output = generada sin cambios")
        cv2.imwrite(out_path, gen_color)
        sys.exit(0)

    print(f"  ✓ Rostro original: x={orig_face[0]} y={orig_face[1]} w={orig_face[2]} h={orig_face[3]}")
    print(f"  ✓ Rostro generado: x={gen_face[0]} y={gen_face[1]} w={gen_face[2]} h={gen_face[3]}")

    # 3. Recortar rostro original con margen (incluye pelo y algo de cuello)
    ox, oy, ow, oh = orig_face
    # Margen: 30% arriba (pelo), 50% abajo (cuello), 20% lados
    margin_top = int(oh * 0.3)
    margin_bottom = int(oh * 0.5)
    margin_side = int(ow * 0.2)

    x1 = max(0, ox - margin_side)
    y1 = max(0, oy - margin_top)
    x2 = min(orig_color.shape[1], ox + ow + margin_side)
    y2 = min(orig_color.shape[0], oy + oh + margin_bottom)

    orig_face_crop = orig_color[y1:y2, x1:x2]
    print(f"  ✓ Rostro recortado (con pelo+ cuello): {orig_face_crop.shape}")

    # 4. Redimensionar al tamaño del rostro generado (con mismo margen)
    gx, gy, gw, gh = gen_face
    g_margin_top = int(gh * 0.3)
    g_margin_bottom = int(gh * 0.5)
    g_margin_side = int(gw * 0.2)

    gx1 = max(0, gx - g_margin_side)
    gy1 = max(0, gy - g_margin_top)
    gx2 = min(gen_color.shape[1], gx + gw + g_margin_side)
    gy2 = min(gen_color.shape[0], gy + oh + g_margin_bottom + g_margin_bottom)

    target_w = gx2 - gx1
    target_h = gy2 - gy1
    print(f"  ✓ Target box en generada: {target_w}x{target_h} en ({gx1},{gy1})")

    # Resize cara original al tamaño del target
    orig_face_resized = cv2.resize(orig_face_crop, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)

    # 5. Convertir todo a B&N
    # Original ya es BGR, la pasamos a gris y luego a BGR de 3 canales
    orig_face_bn = cv2.cvtColor(orig_face_resized, cv2.COLOR_BGR2GRAY)
    orig_face_bn = cv2.cvtColor(orig_face_bn, cv2.COLOR_GRAY2BGR)
    gen_bn = cv2.cvtColor(gen_color, cv2.COLOR_BGR2GRAY)
    gen_bn = cv2.cvtColor(gen_bn, cv2.COLOR_GRAY2BGR)

    # 6. Igualar brillo/contraste del rostro al fondo
    # Calcular media del área donde se va a pegar en la imagen generada
    target_area = gen_bn[gy1:gy2, gx1:gx2]
    gen_mean = target_area.mean()
    orig_mean = orig_face_bn.mean()
    # Ajustar brillo
    brightness_diff = gen_mean - orig_mean
    orig_face_adjusted = np.clip(orig_face_bn.astype(np.int16) + brightness_diff, 0, 255).astype(np.uint8)

    # 7. Componer con PIL (mejor manejo de máscaras)
    base_pil = Image.fromarray(cv2.cvtColor(gen_bn, cv2.COLOR_BGR2RGB))
    face_pil = Image.fromarray(cv2.cvtColor(orig_face_adjusted, cv2.COLOR_BGR2RGB))

    # Aplicar CLAHE (contraste adaptativo) al rostro para igualarlo al estilo
    face_cv = cv2.cvtColor(np.array(face_pil), cv2.COLOR_RGB2BGR)
    face_lab = cv2.cvtColor(face_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(face_lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    face_lab = cv2.merge([l, a, b])
    face_cv = cv2.cvtColor(face_lab, cv2.COLOR_LAB2BGR)
    face_pil = Image.fromarray(cv2.cvtColor(face_cv, cv2.COLOR_BGR2RGB))

    # 8. Pegar con borde difuminado
    feather_paste(base_pil, face_pil, (gx1, gy1), feather=15)

    # 9. Aplicar un suave filtro de grano para integrar todo
    final = np.array(base_pil)
    final_cv = cv2.cvtColor(final, cv2.COLOR_RGB2BGR)

    # Suave sharpening para realzar detalles del rostro
    kernel = np.array([[-0.1, -0.1, -0.1],
                       [-0.1,  1.8, -0.1],
                       [-0.1, -0.1, -0.1]])
    final_cv = cv2.filter2D(final_cv, -1, kernel)

    # 10. Guardar
    cv2.imwrite(out_path, final_cv)
    print(f"\n  ✅ Imagen final guardada: {out_path}")
    print(f"     Tamaño: {fs_size(out_path)}")

def fs_size(path):
    import os
    return f"{os.path.getsize(path)} bytes"

if __name__ == '__main__':
    main()
