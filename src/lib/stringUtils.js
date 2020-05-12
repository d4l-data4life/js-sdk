const stringUtils = {
  addPercentEncoding(string) {
    return encodeURIComponent(string).replace(
      /[!'()*\-_.~]/g,
      c => `%${c.charCodeAt(0).toString(16)}`
    );
  },

  removePercentEncoding(string) {
    return decodeURIComponent(string);
  },

  prepareForUpload(string) {
    return this.addPercentEncoding(string.toLowerCase().trim());
  },
};

export default stringUtils;
