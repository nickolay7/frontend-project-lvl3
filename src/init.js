// import i18next from 'i18next';

import * as yup from "yup";
import watchedState from "./view.js";
import axios from "axios";

export default () => {
  // const i18nextInstance = i18next.createInstance();
  // await i18nextInstance.init({
  //   lng: 'ru',
  //   resources: /* переводы */
  // });

  const state = {
    form: {
      error: '',
    },
    currentData: '',
    feeds: [],
  }

  const rssSchema = yup.string().url();
  const form = document.querySelector('form');

  const parser = (xml) => {
    const parser = new DOMParser();
    return  parser.parseFromString(xml, "application/xml");
  };

  const isValidRss = (url) => {
    if (state.feeds.includes(url)) {
      watchedState.form.error = 'exist';
      return;
    }
    return rssSchema.isValid(url)
      .then((res) => {
          if (res) {
            const feed = `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`;
            axios.get(feed)
              .then((response) => {
                const content = response.data.contents;
                const doc = parser(content);
                if (doc.querySelector('rss')) {
                  watchedState.form.error = 'valid';
                  state.feeds.push(url);
                  return doc;
                } else {
                  watchedState.form.error = 'invalid';
                  throw new Error('ups');
                }
              }).then((data) => watchedState.currentData = data)
              .catch(() => {
                watchedState.form.error = 'inetError';
              });
          } else {
            watchedState.form.error = 'invalid';
          }
        }
      );
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const feed = formData.get('url');
    isValidRss(feed);
  });
};