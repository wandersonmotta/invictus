import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const PROJECT_REF = 'krtjexfyixnhjehndyop';
// Token fornecido pelo usuário
const ACCESS_TOKEN = 'sbp_efaa67f130f8bd41f3254d32f1ecb2dd05d875d3';

const secrets = [
  {
    name: 'RESEND_API_KEY',
    value: 're_3inXa3to_Kscz2CurxjNJ4d9aSpeG2Xax'
  },
  {
    name: 'RESEND_FROM_EMAIL',
    value: 'recuperaracesso@invictusfraternidade.com.br'
  },
  {
    name: 'GOOGLE_AI_STUDIO_API_KEY',
    value: 'AIzaSyB6eTZXcimBIgpvzW6L5lggWgoLtD-iheo'
  }
];

async function pushSecrets() {
  console.log(`🚀 Iniciando configuração de secrets para o projeto ${PROJECT_REF}...`);

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(secrets)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha na API: ${response.status} - ${errorText}`);
    }

    console.log('✅ Sucesso! As seguintes chaves foram configuradas no Supabase:');
    secrets.forEach(s => console.log(`   - ${s.name}`));
    console.log('\nO backend agora está pronto para enviar emails e usar IA.');

  } catch (error) {
    console.error('❌ Erro ao configurar secrets:', error.message);
    process.exit(1);
  }
}

pushSecrets();
