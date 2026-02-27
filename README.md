# Cavalaria Colorado — Registro Judicial

Interface web temática (Velho Oeste) para registro de infrações, cálculo automático de pena e geração de relatório de prisão no Colorado Roleplay.

## 📌 Visão geral

O sistema permite:

- Selecionar crimes carregados dinamicamente via Google Sheets (CSV publicado).
- Somar meses de pena automaticamente.
- Aplicar atenuantes e agravantes em percentual.
- Marcar observações operacionais.
- Registrar itens apreendidos e dinheiro sujo.
- Copiar um relatório formatado para envio.

## 🗂️ Estrutura do projeto

- `colorado-cavalaria.html` → Estrutura da página.
- `colorado-cavalaria.css` → Estilo visual do painel.
- `colorado-cavalaria.js` → Lógica de cálculo, carregamento dos crimes e cópia do relatório.

## ▶️ Como usar

1. Baixe/clone o projeto.
2. Abra o arquivo `colorado-cavalaria.html` em um navegador.
3. Preencha os dados do oficial e do preso.
4. Selecione os crimes.
5. Marque atenuantes/agravantes/observações quando necessário.
6. Clique em **Copiar Relatório**.

## 🔗 Fonte dos crimes (Google Sheets)

Os crimes são carregados por CSV via a constante `SHEETS_CSV_URL` em `colorado-cavalaria.js`.

Exemplo atual:

```js
const SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/SEU_ID/export?format=csv";
```

### Publicar planilha corretamente

1. Abra a planilha no Google Sheets.
2. Vá em **Arquivo → Compartilhar → Publicar na web**.
3. Publique a aba desejada em formato CSV.
4. Cole a URL na constante `SHEETS_CSV_URL`.

## 🧾 Colunas aceitas no CSV

O parser aceita aliases de cabeçalho (com e sem acentos), como:

- Capítulo: `capitulo`, `chapter`, `chaptertitle`
- Número do capítulo: `numerocapitulo`, `chapternumber`
- Artigo: `artigo`, `article`, `art`
- Nome do crime: `crime`, `nomecrime`, `descricao`
- Pena em meses: `meses`, `months`, `pena`, `penameses`
- ID: `id`, `crimeid`, `codigo`

Se alguma coluna vier diferente, ajuste os nomes no cabeçalho da planilha para melhor compatibilidade.

## 🧠 Regras de cálculo

- Pena base = soma dos meses dos crimes selecionados.
- Atenuantes/Agravantes = percentual aplicado sobre a pena base.
- Pena final = valor arredondado e nunca abaixo de 0.

## 🛠️ Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)
- Google Sheets CSV como base de dados

## 👤 Autor

Desenvolvido por [RianGBispo](https://github.com/RianGBispo).
