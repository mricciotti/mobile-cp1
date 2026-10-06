# Chat Firebase — CP2

Aplicativo de chat individual e em grupo desenvolvido com React Native, Expo e TypeScript. O CP2 mantém o Realtime Database para mensagens em tempo real e usa Cloud Firestore como fonte de verdade para perfis, conversas diretas, grupos e dispositivos.

## Stack

- Expo SDK 55, React Native e TypeScript
- Firebase Authentication com e-mail e senha
- Cloud Firestore para dados estruturados e regras de acesso
- Firebase Realtime Database para mensagens e espelho de autorização
- Cloudinary com upload unsigned para imagens do app
- API Node.js/TypeScript/Express hospedada na Vercel
- Expo Notifications para tokens e notificações push

## Estrutura

```text
app-firestore/
  src/
    components/      componentes reutilizáveis
    contexts/        autenticação e registro de push
    hooks/           estado do chat
    navigation/      rotas e abertura por notificação
    screens/         login, cadastro, perfil, contatos, grupos e chat
    services/        Firebase, Cloudinary, API, grupos e notificações
    types/           modelos CP2
    utils/           validações e identificadores
  firestore.rules    regras do Cloud Firestore
  database.rules.json regras do Realtime Database
  firebaseConfig.json configuração pública do Firebase
  server/            API protegida por Firebase ID Token
```

## Dados e segurança

- `users/{uid}` contém somente dados públicos de perfil.
- `users/{uid}/private/profile` contém e-mail, celular e data de nascimento do próprio usuário.
- `users/{uid}/devices/{deviceId}` contém tokens Expo registrados pelo próprio usuário.
- `publicUsers/{uid}` é a projeção pública usada pela busca de contatos.
- `directConversations/{conversationId}` e `groups/{groupId}` são a fonte de verdade das associações.
- `messages/{conversationId}/{messageId}` contém as mensagens CP2 no Realtime Database.
- `conversationMembers/{conversationId}/{uid}` é um espelho privado usado pelas regras do Realtime Database; somente a API Admin o atualiza.

Não há credenciais administrativas no aplicativo. O Firebase Admin SDK usa somente variáveis de ambiente do servidor.

## Variáveis do app

Copie `app-firestore/.env.example` para `.env` durante o desenvolvimento local:

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xyywdpvg
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=MOBILE_CP2
EXPO_PUBLIC_API_BASE_URL=https://seu-projeto.vercel.app
```

O preset do Cloudinary deve permanecer unsigned e usar a pasta `mobile-cp2`. API Secret não deve ser colocado no app.

## API na Vercel

O projeto da Vercel deve usar `app-firestore/server` como Root Directory. Configure no ambiente da Vercel:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_DATABASE_URL=...
EXPO_ACCESS_TOKEN=...
```

A API expõe somente as fronteiras necessárias do CP2:

- `GET /health`
- `GET /users/:uid/private-profile`
- `POST /groups/:groupId/membership/sync`
- `POST /direct-conversations/:conversationId/membership/sync`
- `POST /notifications/messages`

As rotas protegidas exigem `Authorization: Bearer <Firebase ID token>`. O endpoint de notificação recebe apenas `conversationId` e `messageId`; os destinatários são derivados pelo servidor a partir do Firebase.

## Execução e validação

```powershell
cd app-firestore
npm install
npx expo start
npx tsc --noEmit
```

Para validar a API localmente:

```powershell
cd app-firestore/server
npm install
npm run typecheck
npm run lint
npm run dev
```

Push notifications exigem um dispositivo físico e um development build configurado para o projeto Expo. Um ticket `ok` do Expo significa que o serviço aceitou a solicitação; não confirma a entrega no dispositivo. O polling de receipts fica documentado como etapa posterior de auditoria.
