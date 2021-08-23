const stringUtils = {
  addPercentEncoding(string: string): string {
    return encodeURIComponent(string)
      .replace(/[!'()*\-_.~]/g, c => `%${c.charCodeAt(0).toString(16)}`)
      .toLowerCase();
  },

  addFallbackJSEncoding(string: string): string {
    return encodeURIComponent(string).replace(
      /[!'()*\-_.~]/g,
      c => `%${c.charCodeAt(0).toString(16)}`
    );
  },

  addFallbackIOSEncoding(string: string): string {
    return encodeURIComponent(string.toLowerCase()).replace(
      /[!'()*\-_.~]/g,
      c =>
        `%${c
          .charCodeAt(0)
          .toString(16)
          .toUpperCase()}`
    );
  },

  removePercentEncoding(string: string): string {
    return decodeURIComponent(string);
  },

  prepareForUpload(
    string: string,
    useFallback: {
      js?: boolean;
      ios?: boolean;
    } = { js: false, ios: false }
  ): string {
    if (useFallback.js) {
      return this.addFallbackJSEncoding(string.toLowerCase().trim());
    }
    if (useFallback.ios) {
      return this.addFallbackIOSEncoding(string.trim());
    }
    return this.addPercentEncoding(string.toLowerCase().trim());
  },
};

export default stringUtils;
