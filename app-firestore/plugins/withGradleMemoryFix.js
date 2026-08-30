const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// O build no EAS (plano gratuito) falhou com "unknown error" no gradlew logo
// depois do SDK 55/RN 0.83, sem nenhuma mensagem de erro real no log — sinal
// de que o processo foi encerrado abruptamente durante a build nativa.
// Esse plugin edita o android/gradle.properties gerado no prebuild pra
// reduzir o paralelismo e o heap por processo, diminuindo o pico de memória
// usado durante a compilação (mesmo em uma máquina com bastante RAM, muitos
// workers em paralelo podem somar mais do que o disponível).
function withGradleMemoryFix(config) {
    return withDangerousMod(config, [
        "android",
        (config) => {
            const gradlePropertiesPath = path.join(
                config.modRequest.platformProjectRoot,
                "gradle.properties"
            );

            let contents = fs.readFileSync(gradlePropertiesPath, "utf-8");

            contents = contents
                .replace(/^org\.gradle\.jvmargs=.*$/m, "")
                .replace(/^org\.gradle\.parallel=.*$/m, "")
                .replace(/^org\.gradle\.workers\.max=.*$/m, "");

            contents +=
                "\norg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=768m\n" +
                "org.gradle.parallel=false\n" +
                "org.gradle.workers.max=2\n";

            fs.writeFileSync(gradlePropertiesPath, contents);

            return config;
        },
    ]);
}

module.exports = withGradleMemoryFix;
