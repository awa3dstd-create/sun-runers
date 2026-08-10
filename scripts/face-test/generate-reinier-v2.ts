// generate-reinier-v2.ts
// Versión 2: mayor fidelidad facial
// Estrategia: prompt hiper-enfocado en preservación facial + 3 variantes para elegir la mejor
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function generateVariant(zai: any, dataUrl: string, prompt: string, outPath: string) {
  console.log(`  → Generando: ${outPath.split('/').pop()}...`);
  try {
    const response = await zai.images.generations.edit({
      prompt: prompt,
      images: [{ url: dataUrl }],
      size: '1024x1024',
    });
    if (!response.data?.[0]?.base64) {
      console.log(`    ❌ Sin respuesta`);
      return false;
    }
    const buf = Buffer.from(response.data[0].base64, 'base64');
    fs.writeFileSync(outPath, buf);
    console.log(`    ✓ ${buf.length} bytes`);
    return true;
  } catch (e: any) {
    console.log(`    ❌ ${e.message}`);
    return false;
  }
}

async function main() {
  const zai = await ZAI.create();
  const imgBuffer = fs.readFileSync('/home/z/my-project/scripts/face-test/reinier/original.jpg');
  const b64 = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${b64}`;
  console.log(`📊 Imagen original: ${imgBuffer.length} bytes\n`);

  // Estrategia: prompt MÍNIMO en transformaciones, MÁXIMO en preservación
  // La IA tiende a preservar mejor el rostro cuando el prompt es más simple
  // y hace énfasis EXPLÍCITO en "preserve exact facial features"

  const prompts = [
    {
      name: 'reinier-v2a.png',
      // Variante A: prompt simple y directo
      prompt: `Black and white professional portrait, same person as the source image, wearing a white long-sleeve shirt, arms crossed, slight smile, dark gray background, studio lighting. KEEP THE EXACT FACE — same eyes, same nose, same mouth, same facial structure, same hair. Do not alter the facial identity. Editorial photography style.`
    },
    {
      name: 'reinier-v2b.png',
      // Variante B: hiper-específico en preservación
      prompt: `Convert this photo to black and white professional corporate headshot. Person wears white long-sleeve button shirt, arms crossed over chest, closed mouth smile, dark charcoal background. CRITICAL: preserve the person's face exactly — do not change eye shape, eye color, nose, mouth, jawline, cheekbones, hair. Only change clothing, pose, background, color treatment, and lighting. Studio lighting, sharp focus on face.`
    },
    {
      name: 'reinier-v2c.png',
      // Variante C: instrucciones en orden inverso, preservación primero
      prompt: `Preserve this person's facial identity 100% — same face, same features, same hair. Transform only: add white long-sleeve button shirt, cross arms over chest, slight closed-mouth smile, dark gray background, black and white treatment, professional studio lighting. Editorial corporate headshot style. Sharp focus on the face.`
    }
  ];

  for (const p of prompts) {
    await generateVariant(zai, dataUrl, p.prompt, `/home/z/my-project/scripts/face-test/reinier/${p.name}`);
  }

  console.log(`\n✅ 3 variantes generadas`);
}

main();
