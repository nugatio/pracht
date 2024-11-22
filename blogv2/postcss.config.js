module.exports = {
    plugins: [
      require('postcss-class-names')({
        generateScopedName: '[hash:base64:5]' // Randomize class names
      })
    ]
  };
  