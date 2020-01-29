# NestJS

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

# Mediasoup-NestJS-Example

## Dependencies

* [NodeJS 12.14.1](https://www.ubuntuupdates.org/ppa/nodejs_12.x?dist=bionic)
* [Mediasoup](https://mediasoup.org/)

## Installation

```bash
npm i
```

## Running the app

### development

```bash
npm run start:dev
```

### beta

```bash
npm run build
npm run start:beta
```

### prod

```bash
npm run build
npm run start:prod
```

## Running the app not on the local machine

### Update config.json:

```json
  "listenIps": [
    {
      "ip": "192.168.2.239", // your ip
      "announcedIp": null
    }
  ],
  ...
```