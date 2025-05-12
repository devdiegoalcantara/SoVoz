# 🎙️ SoVoz - Plataforma de Comunicação por Voz

<div align="center">
  <img src="generated-icon.png" alt="SoVoz Logo" width="200"/>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

## 🌟 Sobre o Projeto

SoVoz é uma plataforma inovadora de comunicação por voz, desenvolvida para facilitar a interação entre usuários através de mensagens de áudio. O projeto nasceu da necessidade de criar uma experiência mais natural e pessoal de comunicação, combinando a praticidade das mensagens de texto com a riqueza da comunicação verbal.

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - React com TypeScript
  - TailwindCSS para estilização
  - Radix UI para componentes acessíveis
  - Framer Motion para animações
  - React Query para gerenciamento de estado

- **Backend:**
  - Node.js com Express
  - MongoDB para armazenamento de dados
  - WebSocket para comunicação em tempo real
  - JWT para autenticação
  - Multer para upload de arquivos

## 💡 Desafios e Soluções

### 1. Streaming de Áudio em Tempo Real
**Desafio:** Implementar streaming de áudio com baixa latência e alta qualidade.
**Solução:** Utilizamos WebSocket para estabelecer uma conexão bidirecional, permitindo streaming eficiente e minimizando a latência.

### 2. Armazenamento de Arquivos de Áudio
**Desafio:** Gerenciar eficientemente o armazenamento de arquivos de áudio.
**Solução:** Implementamos um sistema de armazenamento em nuvem com MongoDB GridFS, permitindo armazenamento escalável e recuperação rápida.

### 3. Interface Responsiva
**Desafio:** Criar uma interface intuitiva e responsiva para diferentes dispositivos.
**Solução:** Utilizamos TailwindCSS com componentes Radix UI, garantindo uma experiência consistente em todas as plataformas.

## 🎯 Como o Projeto Ajuda as Pessoas

- **Acessibilidade:** Facilita a comunicação para pessoas com dificuldades de digitação
- **Eficiência:** Permite comunicação mais rápida e natural através de mensagens de voz
- **Praticidade:** Combina a conveniência das mensagens de texto com a riqueza da comunicação verbal
- **Conectividade:** Promove conexões mais autênticas entre usuários

## 🛠️ Instalação e Uso

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sovoz.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- Seu Nome - Desenvolvedor Principal

## 🙏 Agradecimentos

- A todos os contribuidores que ajudaram no desenvolvimento
- À comunidade open source por fornecer ferramentas incríveis
- Aos usuários que testaram e forneceram feedback valioso

---

<div align="center">
  <p>Feito com ❤️ e muito café ☕</p>
</div> 