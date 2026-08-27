# Configuração do Firebase, Google Sign-In e Apple Sign-In

Este guia cobre os passos feitos **fora do código**, no Firebase Console, no
Google Cloud Console, no Apple Developer e no EAS, necessários para o app em
`app-firestore/` funcionar. Siga na ordem.

> O código já está pronto para os três métodos de login. O que falta é
> configuração de infraestrutura (chaves, IDs, certificados).

---

## 1. Realtime Database

1. No [Firebase Console](https://console.firebase.google.com/), abra o
   projeto `mobile-17db8`.
2. Menu lateral → **Build → Realtime Database → Create Database**.
3. Escolha uma localização (qualquer uma serve para o trabalho).
4. Comece em **modo bloqueado** (locked mode) — as regras de segurança do
   projeto (`app-firestore/database.rules.json`) já cobrem isso.
5. Copie a **Reference URL** exibida no topo da página (algo como
   `https://mobile-17db8-default-rtdb.firebaseio.com` ou
   `https://mobile-17db8-default-rtdb.southamerica-east1.firebasedatabase.app`)
   e cole em `app-firestore/src/config/firebase.ts`, no campo
   `databaseURL`, substituindo o valor que já está lá (é só um palpite).
6. Na aba **Rules** do Realtime Database, cole o conteúdo de
   `app-firestore/database.rules.json` e publique.

---

## 2. Registrar os apps Android e iOS no Firebase

O projeto hoje só tem um app **Web** cadastrado no Firebase (por isso só
existiam `apiKey`/`authDomain`/etc.). Para os módulos nativos de Google e
Apple, é preciso registrar também os apps Android e iOS.

1. Firebase Console → ⚙️ **Configurações do projeto** → aba **Geral** →
   **Seus apps** → **Adicionar app**.
2. **Android**:
   - Nome do pacote: `com.mobilecp1.chat` (o mesmo definido em
     `app-firestore/app.json`, campo `android.package` — pode trocar os dois
     juntos se preferir outro nome).
   - Baixe o arquivo `google-services.json` gerado e coloque em
     `app-firestore/google-services.json` (raiz do projeto Expo, ao lado do
     `app.json`).
3. **iOS**:
   - Bundle ID: `com.mobilecp1.chat` (mesmo valor de `ios.bundleIdentifier`
     em `app.json`).
   - Baixe o `GoogleService-Info.plist` e coloque em
     `app-firestore/GoogleService-Info.plist`.

---

## 3. Habilitar os provedores no Firebase Authentication

Firebase Console → **Build → Authentication → Sign-in method**:

- **E-mail/senha**: habilite (provavelmente já está habilitado).
- **Google**: habilite e informe um e-mail de suporte. Ao salvar, o Firebase
  cria automaticamente um **Web Client ID** — copie-o.
- **Apple**: habilite. Isso pede um **Services ID**, **Team ID**, **Key ID**
  e uma chave privada `.p8`, todos gerados no **Apple Developer Portal**
  (exige conta paga — Apple Developer Program, US$ 99/ano). Passo a passo
  oficial do Firebase:
  https://firebase.google.com/docs/auth/ios/apple

  > ⚠️ Sem uma conta Apple Developer paga não é possível concluir esta
  > etapa. O código do app já implementa o fluxo corretamente (isso é o que
  > conta para a nota); se não for possível testar de fato por falta da
  > conta, documente isso no README.

---

## 4. Web Client ID do Google no código

Depois de habilitar o Google no passo 3, copie o **Web Client ID** e cole em
`app-firestore/src/services/authService.ts`, substituindo:

```ts
GoogleSignin.configure({
    webClientId: "SUBSTITUA_PELO_WEB_CLIENT_ID_DO_GOOGLE_CLOUD_CONSOLE",
});
```

---

## 5. SHA-1 do Android (necessário para o Google Sign-In funcionar)

O Google exige que o app registrado no Firebase tenha a impressão digital
SHA-1 do certificado usado para assinar o build.

Como o build vai ser feito pelo **EAS** (veja o passo 6), a forma mais simples
é deixar o próprio EAS gerar e gerenciar as credenciais Android, e depois
copiar o SHA-1 gerado por ele:

```bash
cd app-firestore
npx eas credentials
# selecione Android → escolha o keystore gerenciado pelo EAS (ou gere um novo)
# o comando mostra o SHA-1 na tela
```

Copie o SHA-1 exibido e cole em Firebase Console → Configurações do projeto →
app Android → **Adicionar impressão digital**. Depois baixe novamente o
`google-services.json` atualizado e substitua o arquivo local.

---

## 6. Gerar o development build (EAS)

O Google Sign-In nativo (`@react-native-google-signin/google-signin`) e o
Apple Sign-In **não funcionam no app Expo Go** — precisam de um build próprio
("development build"). Isso já está configurado em `app-firestore/eas.json`.

```bash
npm install -g eas-cli   # se ainda não tiver
cd app-firestore
eas login
eas build:configure
eas build --profile development --platform android
# e/ou
eas build --profile development --platform ios   # exige conta Apple Developer paga
```

Ao final, o EAS gera um link/QR code para instalar o app (development client)
no celular/emulador. Depois de instalado, rode:

```bash
npx expo start --dev-client
```

e abra o app instalado (não o Expo Go) — ele vai se conectar ao Metro
bundler normalmente.

---

## Resumo do que precisa ser preenchido no código

| Arquivo | O que preencher |
|---|---|
| `app-firestore/src/config/firebase.ts` | `databaseURL` real do Realtime Database |
| `app-firestore/src/services/authService.ts` | `webClientId` do Google |
| `app-firestore/google-services.json` | arquivo baixado do Firebase (Android) |
| `app-firestore/GoogleService-Info.plist` | arquivo baixado do Firebase (iOS) |
| Firebase Console → Realtime Database → Rules | colar `app-firestore/database.rules.json` |
