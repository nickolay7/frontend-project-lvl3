import i18next from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import resources from './locales/index.js';
import parser from './parser.js';

const route = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`;

export default async () => {
  const form = document.querySelector('form');
  const input = document.querySelector('input[name="url"]');
  const feeds = document.querySelector('.feeds');
  const posts = document.querySelector('.posts');
  const feedback = document.querySelector('.feedback');
  const modalTitle = document.querySelector('.modal-title');
  const modalBody = document.querySelector('.modal-body');
  const fullArticle = document.querySelector('.full-article');
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();

  const feedsRender = (data) => {
    const { title, description } = data;
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
    h3.textContent = title.textContent;
    p.textContent = description.textContent;
    li.appendChild(p);
    li.appendChild(h3);
    ul.prepend(li);
  };

  const addPosts = (container, data) => {
    data.forEach((post, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      const button = document.createElement('button');
      const title = post.querySelector('title').textContent;
      const description = post.querySelector('description').textContent;
      const href = post.querySelector('link').textContent;
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
      button.addEventListener('click', () => {
        modalTitle.textContent = title;
        modalBody.textContent = description;
        fullArticle.setAttribute('href', href);
        a.classList.remove('font-weight-bold');
        a.classList.add('font-weight-normal');
      });
      container.prepend(li);
    });
  };

  const postsRender = (data) => {
    const { postsList } = data;
    if (!posts.querySelector('h2')) {
      const h2 = document.createElement('h2');
      const ul = document.createElement('ul');
      ul.classList.add('list-group');
      h2.textContent = i18n.t('headers.posts');
      posts.appendChild(h2);
      posts.appendChild(ul);
    }
    const ul = posts.querySelector('ul');
    addPosts(ul, postsList);
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

  const errorsHandler = (errors) => {
    switch (errors) {
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
      case 'haveNotErrors':
        classSwitcher(1);
        feedback.textContent = i18n.t('errors.haveNotErrors');
        break;
      case 'networkError':
        classSwitcher(0);
        feedback.textContent = i18n.t('errors.networkError');
        break;
      default:
        break;
    }
  };

  const validateUrl = (url) => {
    const matcher = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/gi;
    return matcher.test(url);
  };

  const validate = (url, watchedState) => {
    if (watchedState.urls.includes(url)) {
      watchedState.form.error = 'exist';
      return null;
    }
    if (validateUrl(url)) {
      const feed = route(url);
      axios.get(feed)
        .then((response) => {
          const content = response.data.contents;
          const data = parser(content);
          if (!data.errors) {
            watchedState.form.error = 'haveNotErrors';
            watchedState.urls.push(url);
            watchedState.currentData = data;
          } else {
            watchedState.form.error = 'noRss';
          }
        })
        .catch(() => {
          watchedState.form.error = 'networkError';
        });
    } else {
      watchedState.form.error = 'invalid';
    }
    return null;
  };

  const postsUpdate = (state) => {
    const { urls } = state;
    const feedsRequest = urls.map((url) => axios.get(route(url)));
    Promise.all(feedsRequest)
      .then((responses) => responses.map((response) => response.data.contents))
      .then((contents) => {
        const linksOnPage = posts.querySelectorAll('a');
        const hrefs = Array.from(linksOnPage).map((el) => el.href);
        const newPosts = contents.map((post) => parser(post).postsList);
        const filtered = newPosts.map((item) => Array.from(item).filter((el) => !hrefs.includes(el.querySelector('link').textContent)));
        const ul = posts.querySelector('ul');
        filtered.forEach((item) => addPosts(ul, item));
      }).then(() => setTimeout(postsUpdate, 5000, state));
  };

  await i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    form: {
      errors: '',
    },
    currentData: '',
    urls: [],
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.error':
        errorsHandler(value);
        break;
      case 'currentData':
        feedsRender(state.currentData);
        postsRender(state.currentData);
        postsUpdate(state);
        break;
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const feed = formData.get('url');
    validate(feed, watchedState);
  });
};
