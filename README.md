# SENAI – Consulta de Reserva de Frota

Sistema web para consulta de veículos reservados, integrado ao Google Sheets via API pública GViz.

## Funcionalidades

- Busca por **nome do motorista** ou **nome de um ocupante**
- Filtro opcional por **data**
- Exibe o veículo reservado (placa e modelo)
- Indica se o veículo possui tag **Sem Parar**
- Mostra **motorista** e **ocupantes** da viagem
- Dados de demonstração quando a planilha estiver indisponível

## Tecnologias

- HTML5 + CSS3 (sem frameworks)
- JavaScript puro (Vanilla JS)
- Google Sheets como banco de dados via GViz Query API

## Estrutura da Planilha

| Coluna | Campo |
|--------|-------|
| A | Solicitação |
| B | Veículo (placa + modelo) |
| C | Localizador |
| D | Motorista |
| E | Data inicial |
| F | Data final |
| G | Local de retirada e devolução |
| H | Turno |
| I | Ocupantes |

## Configuração

Edite as constantes no início de `app.js`:

```js
const CONFIG = {
  sheetId: 'ID_DA_SUA_PLANILHA',
  tabName: '',              // nome da aba (vazio = primeira aba)
  semPararPlacas: [...],   // placas com tag de pedágio
};
```

A planilha precisa estar **publicada na web** (Arquivo → Compartilhar → Publicar na web).

## Como usar

Abra o `index.html` em qualquer servidor HTTP ou hospede em GitHub Pages / Netlify.

---

Desenvolvido para o **SENAI Santa Catarina**.
