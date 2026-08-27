# Chat Firebase — CP1 Mobile Development & IoT

Aplicativo de chat 1 para 1 em React Native + TypeScript, com autenticação
por E-mail/Senha, Google e Apple via Firebase Authentication, e mensagens em
tempo real via Firebase Realtime Database.

## Integrantes

> ⚠️ **Preencher antes da entrega.** Sem nome completo e RM de todos os
> integrantes aqui, o trabalho recebe nota ZERO.

- RM00000 - Nome Completo do Integrante 1
- RM00000 - Nome Completo do Integrante 2

## Tecnologias utilizadas

- React Native
- Expo (SDK 54)
- TypeScript
- Firebase Authentication (e-mail/senha, Google, Apple)
- Firebase Realtime Database
- `@react-native-google-signin/google-signin`
- `expo-apple-authentication`
- EAS Build (development client, necessário para Google/Apple nativos)

## Serviços Firebase utilizados

- **Authentication**: cadastro/login por e-mail e senha, login com Google e
  login com Apple.
- **Realtime Database**: perfis de usuário (`users/{uid}`), conversas
  (`conversations/{conversationId}`) e mensagens
  (`messages/{conversationId}/{messageId}`), todos sincronizados em tempo
  real.

## Limitação conhecida: Apple Sign-In

O login com Apple está **implementado no código** (`loginWithApple` em
`src/services/authService.ts`, botão nativo em `LoginScreen.tsx`,
`usesAppleSignIn` configurado em `app.json`), seguindo a mesma lógica dos
demais provedores.

Porém, para o provedor Apple funcionar de ponta a ponta é necessário
habilitá-lo no Firebase Authentication, o que exige gerar um Services ID,
Team ID e uma chave privada no **Apple Developer Portal** — só acessível com
uma conta paga (Apple Developer Program, US$ 99/ano). Como este é um
projeto acadêmico, optamos por **não contratar essa conta**.

Na prática: o botão de login com Apple aparece normalmente em dispositivos
iOS, mas ao tentar entrar o Firebase retorna o erro "esse método de login
não está habilitado" — comportamento esperado e já tratado na tela de login,
não um bug.

## Regra de comunicação entre provedores

Um usuário só pode conversar com alguém que entrou por um método diferente
de "família":

- E-mail/Senha ↔ Google
- E-mail/Senha ↔ Apple
- Google ↔ Google, Apple ↔ Apple e Google ↔ Apple **não são permitidos**

Essa regra está implementada em
[`app-firestore/src/utils/chatRules.ts`](app-firestore/src/utils/chatRules.ts)
e é aplicada na tela de contatos
([`UsersScreen.tsx`](app-firestore/src/screens/UsersScreen.tsx)), que só
lista pessoas compatíveis com o provedor do usuário logado.

## Estrutura do projeto

```text
app-firestore/
  App.tsx
  app.json
  eas.json
  database.rules.json
  src/
    components/    # Loading, ErrorMessage, UserItem, ChatMessage, ChatInput
    contexts/       # AuthContext (estado de autenticação global)
    hooks/          # useAuth, useChat
    screens/        # LoginScreen, UsersScreen, ChatScreen
    services/       # authService, userService, chatService (Firebase)
    types/          # ChatUser/AuthProvider, Conversation/ChatMessage
    utils/          # chatRules (regra de compatibilidade entre provedores)
    config/         # firebase.ts (inicialização do Firebase)
```

## Configuração do Firebase / Google / Apple

O projeto já está com o código pronto para os três provedores, mas algumas
chaves e cadastros precisam ser feitos manualmente no console do Firebase,
Google Cloud e Apple Developer (URL do Realtime Database, apps Android/iOS,
Web Client ID do Google, credenciais da Apple, regras de segurança).

Passo a passo completo em
[`CONFIGURACAO_GOOGLE_APPLE.md`](CONFIGURACAO_GOOGLE_APPLE.md).

## Como executar

Pré-requisitos: Node.js LTS, uma conta Expo/EAS gratuita e (para Google e
Apple Sign-In reais) um development build gerado via EAS — veja o guia de
configuração acima.

```bash
cd app-firestore
npm install

# Login por e-mail/senha funciona direto no Expo Go:
npx expo start

# Google e Apple Sign-In exigem um development build (não funcionam no
# Expo Go, pois usam módulos nativos):
eas build --profile development --platform android
# depois de instalar o build gerado no dispositivo:
npx expo start --dev-client
```

## Estados tratados na interface

- Carregando (login, envio de mensagens, lista de contatos)
- Erros de autenticação, cadastro, Google/Apple Sign-In e leitura/escrita no
  Realtime Database
- Usuário não autenticado (tela de login)
- Nenhum contato disponível para conversar
- Conversa sem mensagens
- Falha no envio de mensagem

## Prints da aplicação

> Adicionar screenshots das telas de Login, Contatos e Chat aqui antes da
> entrega.
