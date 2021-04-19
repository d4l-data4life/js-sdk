const stringUtils = {
  addPercentEncoding(string: string): string {
    return encodeURIComponent(string).replace(
      /[!'()*\-_.~]/g,
      c =>
        `%${c
          .charCodeAt(0)
          .toString(16)
          .toLowerCase()}`
    );
  },

  addFallbackPercentEncoding(string: string): string {
    return encodeURIComponent(string).replace(
      /[!'()*\-_.~]/g,
      c => `%${c.charCodeAt(0).toString(16)}`
    );
  },

  removePercentEncoding(string: string): string {
    return decodeURIComponent(string);
  },

  prepareForUpload(string: string, useFallback: boolean): string {
    return useFallback
      ? this.addFallbackPercentEncoding(string.toLowerCase().trim())
      : this.addPercentEncoding(string.toLowerCase().trim());
  },
};

export default stringUtils;
