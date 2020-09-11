const stringUtils = {
  addPercentEncoding(string: string): string {
    return encodeURIComponent(string).replace(
      /[!'()*\-_.~]/g,
      c => `%${c.charCodeAt(0).toString(16)}`
    );
  },

  removePercentEncoding(string: string): string {
    return decodeURIComponent(string);
  },

  prepareForUpload(string: string): string {
    return this.addPercentEncoding(string.toLowerCase().trim());
  },
};

export default stringUtils;
