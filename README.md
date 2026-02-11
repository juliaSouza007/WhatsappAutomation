# 🚀 Desafio Técnico: Automação WhatsApp com Fluxos

Um sistema simples de automação para WhatsApp desenvolvido com **Node.js**, **WPPConnect** e **Prisma**. O projeto permite realizar disparos em massa (campanhas) com intervalos aleatórios e configurar fluxos de mensagens automáticas (queues) baseados em passos sequenciais.

## Funcionalidades

* **Importação de Contatos:** Carregamento em massa via arquivos CSV.
* **Gerenciamento de Fluxos:** Criação de sequências de mensagens com delays personalizados por passo.
* **Campanhas de Disparo:** Envio de mensagens para toda a base com atraso (min/max) para evitar banimentos.
* **Worker Inteligente:** Processamento de fila em segundo plano com lógica de re-agendamento automático.
* **Dashboard em Tempo Real:** Visualização do status da fila (Pendente, Enviado, Erro).
* **Tratamento de LID Avançado:** Lógica de contingência para o 9º dígito (DDD Brasil).

## Tecnologias Utilizadas

* **Backend:** [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/)
* **Banco de Dados:** [SQLite](https://www.sqlite.org/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **WhatsApp API:** [WPPConnect](https://wppconnect.io/)
* **Frontend:** HTML, CSS, JavaScript 

##  Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/juliaSouza007/WhatsappAutomation.git](https://github.com/juliaSouza007/WhatsappAutomation.git)
    cd WhatsappAutomation
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados:**
    ```bash
    # Gera o cliente Prisma e as tabelas no SQLite
    npx prisma migrate dev --name init
    
    # Popula o banco com um fluxo de teste (opcional)
    node prisma/seed.js
    ```

## Como Executar

1.  **Inicie o servidor:**
    ```bash
    npm start
    ```
2.  **Acesse o sistema:**
    Abra `http://localhost:3000` no seu navegador.

3.  **Conecte o WhatsApp:**
    Escaneie o QR Code que aparecerá no terminal.

## Estrutura do Projeto

```text
├── prisma/
│   ├── schema.prisma   # Definição das tabelas (Contacts, Flows, Queue)
│   └── seed.js         # Script de população inicial do banco
├── src/
│   ├── lib/            # Instância do Prisma Client
│   ├── queues/         # Worker de processamento em background
│   ├── services/       # WppService (Integração WPPConnect)
│   ├── app.js          # Definição de rotas e APIs
│   └── server.js       # Boot do servidor e conexão WhatsApp
├── public/             # Dashboard (HTML, CSS, JS)
└── uploads/            # Armazenamento temporário de CSVs
```

## Formato do Arquivo CSV

Para que a importação de contatos funcione corretamente, o arquivo `.csv` deve seguir estas regras:

* **Sem cabeçalho:** O sistema começa a ler logo na primeira linha.
* **Colunas:** A primeira coluna deve ser o **Nome** e a segunda o **Telefone**.
* **Telefone:** Deve conter o DDI (55 para Brasil), DDD e o número (apenas dígitos).
* **Codificação:** Recomenda-se salvar como `UTF-8`.

### Exemplo de conteúdo do arquivo (`contatos.csv`):

```csv
João Silva, 5531123456789
Maria Oliveira, 5511999998888
Suporte Empresa, 5521977776666
```
Nota: O sistema remove automaticamente espaços, parênteses e traços dos números durante a importação para garantir a compatibilidade com o WhatsApp.

### Desenvolvido por Júlia Souza - 2026