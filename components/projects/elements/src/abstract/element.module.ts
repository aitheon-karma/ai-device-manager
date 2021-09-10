import {Injector} from '@angular/core';
import {createCustomElement} from '@angular/elements';

const PREFIX = 'ai';

export abstract class ElementModule {
    constructor(injector: Injector, component: InstanceType<any>, name: string) {
        const ngElement = createCustomElement(component, {
            injector,
        });

        customElements.define(`${PREFIX}-${name}`, ngElement as any);
    }

    ngDoBootstrap() {}
}
