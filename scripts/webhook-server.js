#!/usr/bin/env node

/**
 * 🔗 Servidor de Webhooks para Deploy Automático
 * Recebe webhooks do GitHub e executa deploy
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 5001;
const SECRET = process.env.WEBHOOK_SECRET || 'rootgames-webhook-secret-2024';

// Middleware para parsing do body
app.use(express.json());

// Middleware para verificar assinatura do webhook
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// Log de webhooks
const logWebhook = (event, data) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    data: {
      ref: data.ref,
      branch: data.ref?.replace('refs/heads/', ''),
      commit: data.head_commit?.id,
      author: data.head_commit?.author?.name,
      message: data.head_commit?.message
    }
  };

  const logFile = path.join(__dirname, '..', 'logs', 'webhooks.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

  console.log(`📥 Webhook recebido: ${event} - ${logEntry.data.branch}`);
};

// Executar deploy
const executeDeploy = async (branch, commit) => {
  return new Promise((resolve, reject) => {
    const deployScript = path.join(__dirname, 'deploy.sh');

    console.log(`🚀 Iniciando deploy da branch ${branch} (${commit})`);

    exec(`bash ${deployScript} ${branch} ${commit}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro no deploy: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr) {
        console.warn(`⚠️ Warnings no deploy: ${stderr}`);
      }

      console.log(`✅ Deploy concluído: ${stdout}`);
      resolve(stdout);
    });
  });
};

// Endpoint para webhooks do GitHub
app.post('/webhook/github', verifySignature, async (req, res) => {
  try {
    const { ref, head_commit, repository } = req.body;
    const branch = ref.replace('refs/heads/', '');

    logWebhook('push', req.body);

    // Verificar se é uma branch que deve fazer deploy
    const deployBranches = ['main', 'master', 'production'];

    if (!deployBranches.includes(branch)) {
      console.log(`⏭️ Branch ${branch} não configurada para deploy automático`);
      return res.json({ message: 'Branch não configurada para deploy' });
    }

    // Executar deploy
    await executeDeploy(branch, head_commit.id);

    res.json({
      message: 'Deploy iniciado com sucesso',
      branch,
      commit: head_commit.id
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint para webhooks de release
app.post('/webhook/release', verifySignature, async (req, res) => {
  try {
    const { action, release } = req.body;

    logWebhook('release', req.body);

    if (action === 'published') {
      console.log(`🎉 Nova release publicada: ${release.tag_name}`);

      // Executar deploy de produção
      await executeDeploy('production', release.tag_name);

      res.json({
        message: 'Deploy de release iniciado',
        version: release.tag_name
      });
    } else {
      res.json({ message: 'Ação de release não suportada' });
    }

  } catch (error) {
    console.error('❌ Erro no webhook de release:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint para listar webhooks recebidos
app.get('/webhooks/logs', (req, res) => {
  try {
    const logFile = path.join(__dirname, '..', 'logs', 'webhooks.log');

    if (!fs.existsSync(logFile)) {
      return res.json({ logs: [] });
    }

    const logs = fs.readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .slice(-50); // Últimos 50 webhooks

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler logs' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔗 Servidor de webhooks rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Logs: http://localhost:${PORT}/webhooks/logs`);
  console.log(`🔐 Secret configurado: ${SECRET ? '✅' : '❌'}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  process.exit(1);
});
