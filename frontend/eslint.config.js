import hooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
export default [{files:['src/prep/**/*.{js,jsx}','src/App.jsx','src/main.jsx'],languageOptions:{ecmaVersion:2024,sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser}},plugins:{'react-hooks':hooks},rules:{'react-hooks/rules-of-hooks':'error','react-hooks/exhaustive-deps':'warn'}}]
