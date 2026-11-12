# Vistanology — nosso site

**Site publicado:** <https://vistanology.github.io/our-site/>

Landing page da Vistanology para venda de software sob pedido, com estética Frutiger Aero/Vista/7. Feita para apresentar o universo do estúdio, convidar pessoas a pedir um sistema e contar quem está por trás — sem inventar produtos, números ou provas que não existem.

## Rotas

| Rota | O que é |
| --- | --- |
| `/` | Universo Vistanology: hero, catálogo, showroom de capacidades, princípios e contato |
| `/convite-para-criar-sistema` | Convite dedicado para criar um sistema, com formulário honesto (nunca finge envio) |
| `/quem-e-o-dono` | Quem é o dono, com conteúdo vindo do README real do dono |

## Stack

- Next.js (App Router, `output: "export"`) + TypeScript strict
- Tailwind CSS 4 + CSS Modules nas seções mais complexas
- Framer Motion 12 com gating de `prefers-reduced-motion` em todo o site
- Lucide Icons
- Playwright (navegador real, acessibilidade com axe, contratos de honestidade)

## Rodar local

```bash
npm install
npx next dev          # http://localhost:3000
```

## Testes (precisam de um dev server na :3000)

```bash
TEST_BASE_URL=http://localhost:3000 npx playwright test
```

25 testes cobrem as 3 rotas: navegação real, acessibilidade (axe/WCAG 2.1 AA), motion reduzido e contratos de honestidade — por exemplo, o formulário nunca exibe sucesso falso e os previews do showroom rotulam tudo que é conceitual.

## Build de produção

O site é exportado estaticamente com `basePath` para servir no GitHub Pages:

```bash
NEXT_PUBLIC_BASE_PATH=/our-site npx next build   # gera out/
```

O conteúdo de `out/` é publicado na branch `gh-pages` (com `.nojekyll`), e o Pages aponta para essa branch.

## Notas de honestidade

- Nenhum produto, preço, avaliação ou download inventado; o catálogo só mostra o que existe de verdade.
- Sem backend: o formulário não finge guardar nada e a confirmação só acontece com confirmação real do destino.
- Sons começam apenas após interação explícita; nada de autoplay audível.
- Os previews do showroom são conceituais e rotulados como tal — não são gameplay nem produto pronto.

## Sobre este repositório

Mantido pela conta Vistanology. O GitHub pessoal do dono está linkado no rodapé do site.
