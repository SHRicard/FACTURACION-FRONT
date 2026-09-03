const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Config plugin local: fija propiedades en android/gradle.properties.
 *
 * POR QUE EXISTE
 * `android/` es efimero: lo regenera `expo prebuild` y no se commitea, asi que
 * cualquier ajuste hecho a mano ahi se pierde en el siguiente prebuild. La forma
 * correcta de tocar config nativa es declararla en app.json (regla 11).
 *
 * `expo-build-properties` no sirve para esto: solo acepta una lista cerrada de
 * opciones (compileSdkVersion, packagingOptions, etc.) y no propiedades
 * arbitrarias de Gradle. `withGradleProperties` viene con @expo/config-plugins,
 * que ya es parte de Expo: cero dependencias nuevas.
 *
 * USO (en app.json)
 *   ["./plugins/withPropiedadesGradle", { "org.gradle.parallel": "false" }]
 *
 * @param {import('@expo/config-types').ExpoConfig} config
 * @param {Record<string, string | number | boolean>} propiedades
 */
module.exports = function withPropiedadesGradle(config, propiedades = {}) {
  return withGradleProperties(config, (cfg) => {
    const entradas = Object.entries(propiedades);
    if (entradas.length === 0) return cfg;

    let agregoAlguna = false;

    for (const [clave, valor] of entradas) {
      const existente = cfg.modResults.find(
        (item) => item.type === 'property' && item.key === clave,
      );

      if (existente) {
        // Pisar la que genero Expo (ej. org.gradle.parallel=true).
        existente.value = String(valor);
        continue;
      }

      if (!agregoAlguna) {
        cfg.modResults.push({ type: 'empty' });
        cfg.modResults.push({
          type: 'comment',
          value: ' Definido por ./plugins/withPropiedadesGradle.js (app.json)',
        });
        agregoAlguna = true;
      }

      cfg.modResults.push({ type: 'property', key: clave, value: String(valor) });
    }

    return cfg;
  });
};
