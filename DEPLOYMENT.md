# Guia de Deploy - GitHub Pages

## 📋 Checklist Rápido

- [x] Repositório GitHub criado
- [x] Remote origin configurado
- [x] GitHub Pages habilitado nas configurações do repositório
- [x] Primeira push para `main` feita (ativa GitHub Actions)
- [x] Deploy automático completo (~2-3 min)
- [x] Acessar URL em `https://webminst.github.io/questionador-app/`

---

## 🚀 Instruções Passo a Passo

### **1. Criar repositório no GitHub**

1. Acesse [GitHub](https://github.com/new)
2. Crie um novo repositório com o nome: `questionador-app`
3. **NÃO** inicialize com README (já temos um)
4. Copie o comando de remote (parecido com):
   ```
   git remote add origin https://github.com/webminst/questionador-app.git
   git branch -M main
   git push -u origin main
   ```

### **2. Configurar remote e fazer primeiro push**

No terminal do seu projeto:

```powershell
# Adicionar remote do GitHub
git remote add origin https://github.com/webminst/questionador-app.git

# Renomear branch para main
git branch -M main

# Fazer push inicial
git push -u origin main
```

**Aguarde** ~2-3 minutos para o GitHub Actions completar o build e deploy.

### **3. Habilitar GitHub Pages (se necessário)**

1. Abra seu repositório no GitHub
2. Vá para **Settings → Pages**
3. Em "Build and deployment":
   - **Source**: GitHub Actions
   - A ação `peaceiris/actions-gh-pages` criará automaticamente o branch `gh-pages`
4. Salve as configurações

### **4. Acessar seu site**

Após o deploy automático completar, acesse:

```
https://webminst.github.io/questionador-app/
```

---

## 🔄 Workflow de Deploy Contínuo

### **Auto-deploy no push**

Cada vez que você fizer push para `main`:

1. GitHub Actions executa automaticamente:
   - `npm install`
   - `npm run lint` (valida erros)
   - `npm run test:run` (executa testes)
   - `npm run build` (gera artefatos)
   - Deploy para `gh-pages` (serve em HTTPS)

2. Status do build aparece em **Actions** → escolha o workflow
   - ✅ Verde = Deploy sucesso
   - ❌ Vermelho = Build falhou (verifique erros)

### **Desativar auto-deploy (opcional)**

Para apenas validar sem fazer deploy:
- Remova a seção `deploy-to-github-pages` do `.github/workflows/deploy.yml`
- Ou faça push para branch diferente de `main/master`

---

## 📦 Estrutura de Build & Deploy

```
Seu código → git push → GitHub Actions Workflow
                                     ↓
                        1. Lint (eslint)
                        2. Testes (vitest)
                        3. Build (vite)
                        4. Deploy (gh-pages)
                                     ↓
                        dist/ → branch gh-pages → GitHub Pages
                                     ↓
                        https://<usuario>.github.io/questionador-app/
```

---

## 🐛 Troubleshooting

### **Build falha no GitHub Actions**

1. Verifique o log em **Actions → seu workflow → erro específico**
2. Causas comuns:
   - Testes falhando (rode `npm run test:run` localmente)
   - Lint errors (rode `npm run lint` localmente)
   - Versão do Node diferente (workflow usa `node-version: '18'`)

### **Site não aparece depois do deploy**

1. Confirme que o workflow passou (status ✅ em Actions)
2. Aguarde 1-2 minutos (cache do GitHub Pages)
3. Acesse a URL: `https://<usuario>.github.io/questionador-app/`
4. Se erro 404, verifique em **Settings → Pages** que branch é `gh-pages`

### **Blank page ou recursos faltando**

- Problema: Vite está servindo com `base: "/"` mas GitHub Pages espera `base: "/questionador-app/"`
- Solução: Atualize `vite.config.ts` (veja seção abaixo)

---

## ⚙️ Configuração Avançada (Opcional)

### **Usar domínio customizado**

Se você tem um domínio personalizado (ex: `seu-dominio.com`):

1. Crie arquivo `public/CNAME` com seu domínio:
   ```
   seu-dominio.com
   ```

2. Configure DNS (registrador):
   - Crie `CNAME` record: `seu-dominio.com` → `<usuario>.github.io`
   - Ou crie `A` records apontando para IPs do GitHub

3. Atualize `.github/workflows/deploy.yml`:
   ```yaml
   - name: Deploy to GitHub Pages
     uses: peaceiris/actions-gh-pages@v3
     with:
       github_token: ${{ secrets.GITHUB_TOKEN }}
       publish_dir: ./dist
       cname: seu-dominio.com  # Adicione aqui
   ```

### **Servir no subdiretório (base path)**

Se seu repositório é privado ou quer servir em `/questionador-app/`:

1. Atualize `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/questionador-app/',
     // ... resto da config
   })
   ```

2. Reconstrua e faça push:
   ```powershell
   npm run build
   git add .
   git commit -m "Update base path for GitHub Pages subdir"
   git push
   ```

---

## 📊 Monitoramento de Deploys

1. Acesse seu repositório → **Actions**
2. Ver histórico de builds:
   - Cada push dispara um novo build
   - Verde (✅) = Sucesso
   - Vermelho (❌) = Falha
3. Clique no nome do workflow para ver logs detalhados

---

## 🔐 Variáveis de Ambiente (Production)

Se seu app usa `.env` para variáveis de configuração:

1. Crie `.env.production` no raiz do projeto:
   ```
   VITE_API_URL=https://sua-api-production.com
   VITE_ANALYTICS_ID=seu-id
   ```

2. O Vite injeta automaticamente prefixo `VITE_` em build time

---

## ✨ Dicas Finais

- **Versionar releases**: Use GitHub Releases para marcar versões (`v0.1.0`, `v0.2.0`, etc.)
- **Monitorar uptime**: GitHub Pages é hospedado em CDN global (super rápido!)
- **Backup**: Seu código fica salvo no GitHub automático
- **SSL/TLS**: GitHub Pages fornece certificado HTTPS grátis

---

## 📞 Próximas Etapas

1. ✅ Criar repositório no GitHub
2. ✅ Fazer primeiro push para `main`
3. ✅ Aguardar deploy automático (~3 min)
4. ✅ Testar em `https://webminst.github.io/questionador-app/`
5. 📝 (Opcional) Configurar domínio customizado

Qualquer dúvida, verifique os logs em **Actions** do repositório!
