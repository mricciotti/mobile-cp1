# Chat Firebase — CP2

Aplicativo mobile de mensagens individuais e em grupo, desenvolvido para o CP2. O projeto oferece conversas diretas, grupos com administração de integrantes, mensagens em tempo real, perfis, menções e notificações push por uma API própria.

## Descrição

- Conversas diretas entre exatamente dois usuários.
- Grupos com owner, integrantes, limite de membros e política de notificações.
- Mensagens em tempo real usando Firebase Realtime Database.
- Perfis públicos e dados privados separados no Cloud Firestore.
- Menções com autocomplete: a seleção visual do usuário gera `mentionedUserIds`.
- Push notifications calculadas pelo servidor, sem destinatários confiados ao app.
- API Express protegida por Firebase ID Token e hospedada na Vercel.

## Tecnologias

- React Native
- Expo SDK 55
- TypeScript
- Firebase Authentication
- Firebase Realtime Database
- Cloud Firestore
- Firebase Cloud Messaging, integrado ao fluxo de notificações Android/Expo
- Expo Notifications
- Cloudinary
- Node.js, TypeScript e Express
- Vercel

## Firebase

- **Authentication:** cadastro e login por e-mail e senha. Não há login Google ou Apple.
- **Firestore:** perfis, projeção pública de usuários, conversas diretas, grupos, estado de leitura e dispositivos.
- **Realtime Database:** mensagens e `conversationMembers`, o espelho usado para autorizar a leitura e gravação das mensagens.
- **FCM/Expo Notifications:** entrega de notificações push em dispositivos compatíveis. O app registra tokens Expo; o servidor calcula os destinatários e envia pelo serviço de push.

O arquivo `app-firestore/firebaseConfig.json` contém somente configuração pública do cliente Firebase. Credenciais administrativas ficam exclusivamente nas variáveis de ambiente do servidor.

## Estrutura

```text
app-firestore/
  src/
    components/      componentes reutilizáveis e UI
    config/          inicialização Firebase Web/Native
    contexts/        estado global de autenticação
    hooks/           estado do chat e autenticação
    navigation/      rotas e abertura por notificação
    screens/         login, cadastro, perfil, contatos, grupos e chat
    services/        Auth, Firestore, RTDB, Cloudinary, API e push
    types/           modelos de domínio do CP2
    utils/           validações e identificadores
  firestore.rules    regras do Cloud Firestore
  database.rules.json regras do Realtime Database
  firebase.json      mapeamento das Rules para o Firebase CLI
  firebaseConfig.json configuração pública do Firebase
  server/             API Express
    src/              autenticação, membership, perfis e notificações
```

## Configuração do app

Crie `app-firestore/.env` a partir de `app-firestore/.env.example`. O arquivo real não deve ser versionado.

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xyywdpvg
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=MOBILE_CP2
EXPO_PUBLIC_API_BASE_URL=https://mobile-cp2-api.vercel.app
```

Essas são configurações públicas usadas pelo frontend. Não coloque API Secret do Cloudinary, service account, private key ou qualquer credencial administrativa no app.

## Cloudinary

- Upload unsigned pelo `expo-image-picker` e `imageService.ts`.
- Upload preset: `MOBILE_CP2`.
- Pasta: `mobile-cp2`.
- O app salva somente a `secure_url` final no Firestore.
- Fotos de perfil e fotos de grupo são escolhidas do dispositivo e enviadas somente no momento de salvar.
- Base64 e API Secret não são usados no app.

## API

API pública:

```text
https://mobile-cp2-api.vercel.app
```

Health check:

```text
https://mobile-cp2-api.vercel.app/health
```

Endpoints:

- `GET /health`
- `GET /users/:uid/private-profile`
- `POST /groups/:groupId/membership/sync`
- `POST /direct-conversations/:conversationId/membership/sync`
- `POST /notifications/messages`

As rotas protegidas recebem o Firebase ID Token no header:

```http
Authorization: Bearer <Firebase ID token>
```

O endpoint de notificações recebe somente `conversationId` e `messageId`. A API consulta Firestore/RTDB para calcular os destinatários e não confia em uma lista enviada pelo app.

O professor não precisa iniciar a API local para testar a aplicação: o frontend já aponta para a API pública da Vercel.

## Variáveis da API

Configure estas variáveis no ambiente da API, por exemplo na Vercel:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=base64-encoded-service-account-json
FIREBASE_DATABASE_URL=https://mobile-17db8-default-rtdb.firebaseio.com
EXPO_ACCESS_TOKEN=
PORT=3001
```

`FIREBASE_SERVICE_ACCOUNT_BASE64` contém o JSON inteiro da service account codificado em Base64. O valor real não deve aparecer no repositório, no app ou no GitHub. Não são necessárias variáveis separadas de projeto, e-mail de cliente ou chave privada.

## Segurança

- Service account e credenciais administrativas ficam fora do repositório.
- Firebase Admin SDK roda somente no servidor.
- Tokens de dispositivos ficam privados em `users/{uid}/devices/{deviceId}`.
- As Firestore Rules exigem autenticação e restringem perfis, conversas e grupos.
- As Realtime Database Rules não possuem `.read` ou `.write` global aberto.
- Mensagens só podem ser lidas por usuários presentes em `conversationMembers`.
- O servidor sincroniza `conversationMembers` usando Firebase Admin.
- O `senderId` precisa corresponder ao usuário autenticado.
- Usuários removidos de grupos deixam de ter acesso às novas mensagens.

## Conversas diretas

Uma conversa direta possui exatamente dois participantes. O ID é determinístico, formado pelos UIDs ordenados, evitando duplicatas. Antes de criar, o app consulta as conversas do usuário e verifica se já existe a associação entre os dois participantes. Depois da criação, a API sincroniza os membros no RTDB.

## Grupos

Grupos possuem owner, `memberIds`, `memberLimit`, foto e política de notificações. O owner pode:

- adicionar integrantes;
- remover integrantes, exceto a si mesmo;
- alterar o limite;
- alterar nome, foto e política de push.

`GroupInfo` mostra os dados do grupo e seus membros. Um integrante removido perde acesso às novas mensagens depois da sincronização de membership.

## Concorrência do `memberLimit`

Alterações de integrantes e limite usam Firestore transactions. As regras também validam que `memberLimit >= memberIds.size()`, que o owner permanece no grupo e que os IDs/dados possuem o formato esperado. O limite não depende somente da UI.

## Menções

Em grupos, digitar `@` abre sugestões dos membros atuais, sem incluir o próprio usuário. A seleção de uma sugestão insere `@nome` e guarda o UID correspondente. O envio usa `mentionedUserIds`, remove duplicatas e não infere destinatários apenas por regex do texto. O backend valida as menções e calcula os destinatários autorizados.

## Push Notifications

As políticas de grupo são:

- `all_group_messages`
- `mentioned_members`
- `direct_messages_only`
- `disabled`

O remetente não recebe o próprio push. O servidor calcula os destinatários, ignora tokens desabilitados e envia payload com `conversationId` e `conversationType`. O toque da notificação abre a conversa correspondente.

O app não possui credenciais administrativas. Um ticket `ok` do Expo significa que o Expo aceitou a solicitação; não confirma entrega no dispositivo. Receipts podem ser consultados em uma etapa posterior de auditoria.

## Android

- `google-services.json` é usado pela configuração Android do Firebase.
- `expo-notifications` solicita permissão e registra o Expo Push Token.
- Push real deve ser validado em dispositivo ou development build, não somente no navegador.
- É possível usar EAS:

```bash
npx eas-cli build --platform android --profile preview
```

Build local:

```bash
npx expo run:android
```

O build local requer Android SDK configurado e JDK 17. O arquivo local `android/local.properties` não é versionado.

## iOS

- `GoogleService-Info.plist` deve estar configurado para o bundle identifier do app.
- Push real exige APNs e uma conta Apple Developer configurada no EAS.
- O build pode ser feito com EAS.
- Não foi declarado aqui teste real de iOS; a validação executada neste ambiente foi focada em Web e Android.

## Execução

Frontend:

```bash
cd app-firestore
npm install
npx expo start
npx tsc --noEmit
```

API:

```bash
cd app-firestore/server
npm install
npm run typecheck
npm run lint
```

Para exportar o frontend Web:

```bash
cd app-firestore
npm run build:web
```

## Regras Firebase

As regras versionadas estão em:

- `app-firestore/firestore.rules`
- `app-firestore/database.rules.json`

O `app-firestore/firebase.json` permite futuros comandos controlados:

```bash
firebase deploy --only firestore:rules,database
```

Antes de publicar, confirme o projeto Firebase selecionado no CLI e compare o conteúdo local com o publicado. Nenhum deploy de Rules é feito automaticamente por este README.

## Prints da aplicação

Não há screenshots finais versionados no repositório. Inserir, na entrega, prints reais de:

- login e cadastro;
- lista de conversas;
- conversa direta;
- grupo;
- administração de grupo;
- perfil;
- autocomplete de menção;
- push recebido.

## Evidência de push

Inserir um screenshot real de uma notificação recebida em dispositivo Android ou development build. O print deve mostrar a notificação e, se possível, a abertura da conversa correta após o toque. Não há evidência de push versionada neste repositório neste momento.

## Integrantes

- RM554673 — Fernanda Rocha Menon
- RM556237 — Luiza Macena Dantas
- RM558537 — Luan Ramos Garcia de Souza
- RM556930 — Matheus Ricciotti
- RM555189 — Matheus Bortolotto

## Entrega

GitHub: https://github.com/mricciotti/mobile-cp1

API pública: https://mobile-cp2-api.vercel.app

Health: https://mobile-cp2-api.vercel.app/health

O professor não precisa iniciar a API local para avaliar o app; a configuração pública do frontend aponta para a API hospedada na Vercel.
