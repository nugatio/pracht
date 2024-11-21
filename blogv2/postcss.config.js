module.exports = {
    plugins: [
        require('autoprefixer')({
            overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead']
        }),
        require('cssnano')({
            preset: 'default'
        })
    ]
}