// test-face-edit.ts
// Prueba real de preservación facial con z-ai image-edit
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();

  // Leer imagen original y convertir a base64 data URL
  const imgBuffer = fs.readFileSync('/home/z/my-project/scripts/face-test/original.jpg');
  const b64 = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${b64}`;

  console.log(`📊 Imagen original: ${imgBuffer.length} bytes`);

  // Prompt detallado para preservar identidad
  const prompt = `Black and white professional portrait of this same person, wearing a white long-sleeve button-up shirt, arms crossed over chest, slight closed-mouth smile without showing teeth, dark charcoal gray background, dramatic studio lighting, high contrast, preserve the person's exact facial features and identity, professional corporate headshot style, sharp focus on face`;

  console.log(`🎨 Enviando request de edición...`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

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
    const outPath = '/home/z/my-project/scripts/face-test/edited.png';
    fs.writeFileSync(outPath, outBuffer);

    console.log(`✅ Imagen editada guardada: ${outPath}`);
    console.log(`   Tamaño: ${outBuffer.length} bytes`);
  } catch (e: any) {
    console.error(`❌ Error: ${e.message}`);
    if (e.response) console.error('Response:', e.response);
    process.exit(1);
  }
}

main();
