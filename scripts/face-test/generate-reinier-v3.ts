// generate-reinier-v3.ts
// Versión 3: body-first, face-after
// 1. Generar el cuerpo+escena B&N (sin cara) con image-edit
// 2. Recortar el rostro de la foto original
// 3. Composite: pegar el rostro original en el cuerpo generado, con blending
// 4. B&N final para uniformar todo
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import { execSync } from 'child_process';

async function main() {
  const zai = await ZAI.create();
  const src = '/home/z/my-project/scripts/face-test/reinier/original.jpg';
  const imgBuffer = fs.readFileSync(src);
  const b64 = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${b64}`;

  console.log('🎨 Generando escena B&W con cuerpo + pose + ropa (la cara se reemplazará después)...');

  // Prompt pidiendo cuerpo + pose + ropa + fondo, ignorando la cara
  const prompt = `Black and white professional corporate headshot photograph. The person wears a white long-sleeve button-up shirt, arms crossed confidently over chest. Dark charcoal gray background. Dramatic studio lighting, soft key light from front-left, high contrast. Editorial photography style. Sharp focus. Looking directly at camera. The head should be facing forward, eyes looking at camera, slight closed-mouth smile, head and shoulders framing.`;

  const response = await zai.images.generations.edit({
    prompt: prompt,
    images: [{ url: dataUrl }],
    size: '1024x1024',
  });

  if (!response.data?.[0]?.base64) {
    console.error('❌ Sin respuesta');
    process.exit(1);
  }

  const buf = Buffer.from(response.data[0].base64, 'base64');
  const genPath = '/home/z/my-project/scripts/face-test/reinier/v3-generated-body.png';
  fs.writeFileSync(genPath, buf);
  console.log(`✅ Cuerpo generado: ${genPath} (${buf.length} bytes)`);

  // Detectar rostro en la original con Python + OpenCV/InsightFace
  console.log('\n🔍 Detectando rostro en la imagen original...');
  const pyScript = `/home/z/my-project/scripts/face-test/face-composite.py`;
  const result = execSync(
    `python3 ${pyScript} ` +
    `/home/z/my-project/scripts/face-test/reinier/original.jpg ` +
    `${genPath} ` +
    `/home/z/my-project/scripts/face-test/reinier/reinier-v3-final.png`,
    { encoding: 'utf-8' }
  );
  console.log(result);
}

main();
