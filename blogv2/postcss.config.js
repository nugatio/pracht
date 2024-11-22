module.exports = {
    plugins: [
      require('postcss-modules')({
        generateScopedName: '[hash:base64:5]', // Short hashed class names
        getJSON: (cssFileName, json, outputFileName) => {
          // Save mapping between original and obfuscated class names
          const fs = require('fs');
          const path = require('path');
          const fileName = path.resolve('./class-names.json');
          fs.writeFileSync(fileName, JSON.stringify(json, null, 2));
        },
      }),
    ],
  };
  