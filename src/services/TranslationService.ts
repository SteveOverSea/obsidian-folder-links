// language data in window.i18next.store.data

export class TranslationService {

    constructor(private i18next: any) {
        if (!i18next) {
            throw Error('No translations found');
        }
    }

    getTranslation(key: string, placeholders?: Record<string, string>): string {
        return this.i18next.t(key, placeholders);
    }
}