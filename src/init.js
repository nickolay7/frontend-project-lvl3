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
  const submitButton = form.querySelector('[type="submit"]');
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
      submitButton.disabled = false;
    }
  };

  const feedbackRender = (state) => {
    switch (state) {
      case 'validating':
        submitButton.disabled = true;
        break;
      case 'empty':
        classSwitcher(0);
        feedback.textContent = i18n.t('form.empty');
        break;
      case 'noRss':
        classSwitcher(0);
        feedback.textContent = i18n.t('feed.noRss');
        break;
      case 'invalidUrl':
        classSwitcher(0);
        feedback.textContent = i18n.t('form.invalidUrl');
        break;
      case 'exist':
        classSwitcher(0);
        feedback.textContent = i18n.t('form.exist');
        break;
      case 'loaded':
        classSwitcher(1);
        feedback.textContent = i18n.t('feed.loaded');
        submitButton.disabled = false;
        break;
      case 'errorLoad':
        classSwitcher(0);
        feedback.textContent = i18n.t('feed.networkError');
        break;
      default:
        break;
    }
  };

  const feedLoad = (url, watchedState) => {
    const feed = route(url);
    axios.get(feed)
      .then((response) => {
        const content = response.data.contents;
        const data = parser(content);
        if (!data.errors) {
          watchedState.feedLoad = 'loaded';
          watchedState.urls.push(url);
          watchedState.currentData = data;
        } else {
          watchedState.feedLoad = 'noRss';
        }
      })
      .catch(() => {
        watchedState.feedLoad = 'errorLoad';
      });
  };

  const validateUrl = (url) => {
    const matcher = /^https?:\/\/.+\.\w{2,3}(.+)?$/i;
    return matcher.test(url);
  };

  const validate = (url, watchedState) => {
    if (watchedState.urls.includes(url)) {
      watchedState.form.state = 'exist';
      return null;
    }
    if (validateUrl(url)) {
      feedLoad(url, watchedState);
      return null;
    }
    watchedState.form.state = 'invalidUrl';
    return null;
  };

  const postsUpdate = (watchedState) => {
    const { urls } = watchedState;
    const feedsRequest = urls.map((url) => axios.get(route(url)));
    Promise.all(feedsRequest)
      .then((responses) => {
        // get all fids content
        const contents = responses.map((response) => response.data.contents);
        // get posts lists array
        const newPostsLists = contents.map((post) => parser(post).postsList);
        const linksOnPage = posts.querySelectorAll('a');
        const hrefs = Array.from(linksOnPage).map((el) => el.href);
        // get new posts lists array
        const filtered = newPostsLists.map((item) => Array.from(item).filter((el) => !hrefs.includes(el.querySelector('link').textContent)))
          .filter((el) => el.length !== 0);
        if (filtered.length !== 0) {
          watchedState.feedLoad = 'updated';
          watchedState.newPosts = filtered;
        }
      });
    return setTimeout(postsUpdate, 5000, watchedState);
  };

  const newPostsRender = (container, data) => {
    if (data) {
      data.forEach((item) => addPosts(container, item));
    }
  };

  await i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    form: {
      state: '',
    },
    // feedLoad: '',
    currentData: '',
    newPosts: '',
    urls: [],
  };

  const watchedState = onChange(state, (path, value) => {
    const ul = posts.querySelector('ul');
    switch (path) {
      case 'form.state':
        feedbackRender(value);
        break;
      case 'feedLoad':
        feedbackRender(value);
        break;
      case 'currentData':
        feedsRender(value);
        postsRender(value);
        postsUpdate(watchedState);
        break;
      case 'newPosts':
        newPostsRender(ul, value);
        break;
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const feed = formData.get('url');
    watchedState.form.state = 'validating';
    validate(feed, watchedState);
  });
};
