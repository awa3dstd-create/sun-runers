// generate-reinier-portrait.ts
// Genera retrato profesional B&W de Reinier Barionuevo
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();

  const imgBuffer = fs.readFileSync('/home/z/my-project/scripts/face-test/reinier/original.jpg');
  const b64 = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${b64}`;

  console.log(`📊 Imagen original: ${imgBuffer.length} bytes`);

  const prompt = `Black and white professional corporate portrait of this same person, wearing a clean white long-sleeve button-up shirt, arms crossed confidently over chest, slight closed-mouth smile without showing teeth, dark charcoal gray background, dramatic studio lighting with soft key light from the front-left, high contrast professional headshot, sharp focus on face, preserve the person's exact facial features and identity — same face shape, same eyes, same nose, same hair, same skin tone, professional editorial photography style, looking directly at camera`;

  console.log(`🎨 Generando retrato profesional de Reinier...`);

  try {
    const response = await zai.images.generations.edit({
      prompt: prompt,
      images: [{ url: dataUrl }],
      size: '1024x1024',
    });

    if (!response.data || !response.data[0] || !response.data[0].base64) {
      console.error('❌ Respuesta inválida:', JSON.stringify(response, null, 2));
      process.exit(1);
    }

    const outBuffer = Buffer.from(response.data[0].base64, 'base64');
    const outPath = '/home/z/my-project/scripts/face-test/reinier/edited.png';
    fs.writeFileSync(outPath, outBuffer);

    console.log(`✅ Imagen editada guardada: ${outPath}`);
    console.log(`   Tamaño: ${outBuffer.length} bytes`);
  } catch (e: any) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
}

main();
