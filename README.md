# T2CH-framework
Node.js version of T2CH platform framework

### Get starting
* Установить [NodeJS](https://nodejs.org/en/download/)
* Из папки с проектом
```sh
$ npm i
$ npm run utility
```
* Следуем инструкциям утилиты по созданию генезисного блока.

* В корне проекта создаем файл config.js со следующим содержанием:
```
module.exports = {
    STUN: [],
    initConnection: [],
    tests: {
      nodes: [],
    },
  };
```

* Для запуска:
```
$ npm start
```

* Подробная инструкция к консольному интерфейсу [тут](https://github.com/t2ch/T2CH-framework/wiki/%D0%9E%D0%BF%D0%B8%D1%81%D0%B0%D0%BD%D0%B8%D0%B5-%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D1%84%D0%B5%D0%B9%D1%81%D0%B0).
