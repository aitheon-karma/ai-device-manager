# Aitheon - Device Manager

Core Libs minimum: 
```
"@aitheon/core-server": "3.0.1",
"@aitheon/transporter": "3.0.1"
```

`server/index.ts`
```
'use strict';
import 'ts-helpers';
import 'reflect-metadata';
import { Application } from './config/application';

export default new Application();

```


`server/config/application.ts`
```
...

Container.set('environment', environment);
const transporter = new TransporterBroker(`${ environment.service._id }${ environment.production ? '' : '_DEV'}`);
transporter.start();

...

```
