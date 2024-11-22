## Prerequisites

- Node.js 18

## Installation

```sh
npm install
```

## Setup

```sh
cp .env.ci .env
```

## Running Tests

```sh
npm test
```

## Running the Application

```sh
cp .env.dev .env
```

Start the application:

```sh
npm run dev
```

## Usage

To get the price index for BTC-USDT:

```sh
curl -X GET http://localhost:3000/price-index/BTC-USDT
```