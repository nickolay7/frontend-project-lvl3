import i18next from 'i18next';
import * as yup from "yup";
import axios from "axios";
import onChange from "on-change";
import resources from './locales/index.js';

export default () => {
  const form = document.querySelector('.rss-form');
  const input = document.querySelector('input[name="url"]');
  const feeds = document.querySelector('.feeds');
  const posts = document.querySelector('.posts');
  const feedback = document.querySelector('.feedback');
  const modalTitle = document.querySelector('.modal-title');
  const modalBody = document.querySelector('.modal-body');
  const fullArticle = document.querySelector('.full-article');

  const feedsRender = (doc, i18n) => {
    form.reset();
    if (!feeds.querySelector('h2')) {
      const h2 = document.createElement('h2');
      const ul = document.createElement('ul');
      ul.classList.add('list-group', 'mb-5');
      h2.textContent = i18n.t('headers.feeds');
      feeds.appendChild(h2);
      feeds.appendChild(ul);
    }
    const ul = feeds.querySelector('ul');
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    const p = document.createElement('p');
    li.classList.add('list-group-item');
    h3.textContent = doc.querySelector('title').textContent;
    p.textContent = doc.querySelector('description').textContent;
    li.appendChild(p);
    li.appendChild(h3);
    ul.prepend(li);
  };

  const addPosts = (container, data) => {
    data.forEach((item, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      const button = document.createElement('button');
      const title = item.querySelector('title').textContent;
      const description = item.querySelector('description').textContent;
      const href = item.querySelector('link').textContent;
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
      a.classList.add('font-weight-bold');
      a.dataset.id = index;
      a.setAttribute('target', '_blank');
      a.setAttribute('href', href);
      button.setAttribute('type', 'button');
      button.classList.add('btn', 'btn-primary', 'btn-sm');
      button.dataset.id = index;
      button.dataset.toggle = 'modal';
      button.dataset.target = '#modal';
      a.textContent = title;
      button.textContent = 'Просмотр';
      li.appendChild(a);
      li.appendChild(button);
      button.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        modalTitle.textContent = title;
        modalBody.textContent = description;
        fullArticle.setAttribute('href', href);
        a.classList.remove('font-weight-bold');
        a.classList.add('font-weight-normal');
      });
      container.prepend(li);
    });
  }

  const postsRender = (doc, i18n) => {
    if (!posts.querySelector('h2')) {
      const h2 = document.createElement('h2');
      const ul = document.createElement('ul');
      ul.classList.add('list-group');
      h2.textContent = i18n.t('headers.posts');
      posts.appendChild(h2);
      posts.appendChild(ul);
    }
    const ul = posts.querySelector('ul');
    const items = doc.querySelectorAll('item');
    addPosts(ul, items);
  };

  const classSwitcher = (success) => {
    if (success) {
      input.classList.remove('is-invalid');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.classList.remove('text-success');
    }
  };

  const errorHandler = (error, i18n) => {
    switch (error) {
      case 'empty':
        classSwitcher(0);
        feedback.textContent = i18n.t('errors.empty');
        break;
      case 'noRss':
        classSwitcher(0);
        feedback.textContent = i18n.t('errors.noRss');
        break;
      case 'invalid':
        classSwitcher(0);
        feedback.textContent = i18n.t('errors.invalid');
        break;
      case 'exist':
        classSwitcher(0);
        feedback.textContent = i18n.t('errors.exist');
        break;
      case 'valid':
        classSwitcher(1);
        feedback.textContent = i18n.t('errors.valid');
        break;
      case 'inetError':
        classSwitcher(0);
        feedback.textContent = i18n.t('errors.inetError');
      default:
        break;
    }
  };

  const parser = (xml) => {
    const parser = new DOMParser();
    return  parser.parseFromString(xml, "application/xml");
  };

  const rssSchema = yup.string().url();

  const isValidRss = (url, watchedState) => {
    // if (url === 'ссылка RSS') {
    //   watchedState.form.error = 'empty';
    // }
    if (watchedState.feeds.includes(url)) {
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
                  watchedState.feeds.push(feed);
                  return doc;
                } else {
                  watchedState.form.error = 'noRss';
                  return 'noRss';
                }
              })
              .then((data) => {
                if (data !== 'noRss') {
                  watchedState.currentData = data;
                }
              })
              .catch((err) => {
                // console.log(err.message);
                watchedState.form.error = 'inetError';
              });
          } else {
            watchedState.form.error = 'invalid';
          }
        }
      );
  };

  const postsUpdate = (state, i18n) => {
    const feeds = state.feeds;
    const promises = feeds.map((feed) => axios.get(feed));
    const xmls = Promise.all(promises).then((responses) => responses.map((response) => response.data.contents));
    xmls.then((data) => {
      const hrefsOnPage = posts.querySelectorAll('a');
      const hrefs = Array.from(hrefsOnPage).map((el) => el.href);
      const items = data.map((content) => parser(content)).map((item) => item.querySelectorAll('item'));
      const filtered = items.map((item) => Array.from(item).filter((el) => !hrefs.includes(el.querySelector('link').textContent)));
      // console.log(filtered);
      const ul = posts.querySelector('ul');
      filtered.forEach((item) => addPosts(ul, item));
    }).then(() => setTimeout(postsUpdate, 5000, state, i18n));
  };

  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    form: {
      error: '',
    },
    currentData: '',
    feeds: [],
  }

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      // case 'lng': i18nInstance.changeLanguage(value).then(() => render(watchedState i18nInstance));
      //   break;
      case 'form.error':
        errorHandler(value, i18n);
        break;
      case 'currentData':
        feedsRender(state.currentData, i18n);
        postsRender(state.currentData, i18n);
        postsUpdate(state, i18n);
        break;
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const feed = formData.get('url');
    isValidRss(feed, watchedState);
  });
};
