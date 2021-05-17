import i18next from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import * as yup from 'yup';
import _ from 'lodash';
import resources from './locales/index.js';
import parser from './parser.js';

const route = () => new URL('https://hexlet-allorigins.herokuapp.com/get?disableCache=true');
const getQueryString = (data) => {
  const url = route();
  url.searchParams.append('url', data);
  return url.href;
};

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
  const currentData = {};
  const listsDb = [];

  // FEED_RENDER_______________________________________________
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
    ul.append(li);
  };
  // POSTS_RENDER__________________________________________________________
  const addPosts = (container, data) => {
    data.forEach((post, index) => {
      const { postTitle, postDescription, link } = post;
      const li = document.createElement('li');
      const a = document.createElement('a');
      const button = document.createElement('button');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
      a.classList.add('font-weight-bold');
      a.dataset.id = index;
      a.setAttribute('target', '_blank');
      a.setAttribute('href', link);
      button.setAttribute('type', 'button');
      button.classList.add('btn', 'btn-primary', 'btn-sm');
      button.dataset.id = index;
      button.dataset.toggle = 'modal';
      button.dataset.target = '#modal';
      a.textContent = postTitle;
      button.textContent = 'Просмотр';
      li.appendChild(a);
      li.appendChild(button);
      button.addEventListener('click', () => {
        modalTitle.textContent = postTitle;
        modalBody.textContent = postDescription;
        fullArticle.setAttribute('href', link);
        a.classList.remove('font-weight-bold');
        a.classList.add('font-weight-normal');
      });
      container.append(li);
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
  // POSTS_UPDATE__________________________________________________________________________
  const postsUpdate = (watchedState, data) => {
    const feedsRequest = data.map((url) => axios.get(getQueryString(url)).catch(() => []));
    Promise.all(feedsRequest)
      .then((responses) => {
        // get all fids content
        const contents = responses.map((response) => {
          if (response.length !== 0) {
            return response.data.contents;
          }
          return null;
        });
        // get posts lists array
        const newPostsLists = contents.map((post) => parser(post).postsList);
        // get new posts lists array
        const filtered = newPostsLists
          .map((items) => _.differenceBy([...items], listsDb.flat(2), 'link'))
          .filter((el) => el.length !== 0);
        if (filtered.length !== 0) {
          listsDb.push(filtered);
        }
        currentData.data = filtered;
        // watchedState.feedLoad = 'updated';
        const container = posts.querySelector('ul');
        if (container) {
          filtered.forEach((item) => addPosts(container, item));
        }
      })
      .then(() => setTimeout(postsUpdate, 5000, watchedState, data));
    // return
  };
  // FEEDBACK____________________________________________
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

  const feedbackRender = (message) => {
    switch (message) {
      case 'loading':
        submitButton.disabled = true;
        input.setAttribute('readonly', 'readonly');
        break;
      // case 'form.invalid':
      //   classSwitcher(0);
      //   submitButton.disabled = false;
      //   feedback.textContent = i18n.t(value);
      //   break;
      case 'feed.loaded':
        classSwitcher(1);
        feedback.textContent = i18n.t(message);
        submitButton.disabled = false;
        input.removeAttribute('readonly');
        break;
      default:
        classSwitcher(0);
        feedback.textContent = i18n.t(message);
        submitButton.disabled = false;
        input.removeAttribute('readonly');
        break;
    }
  };

  // i18init_________________________________________________
  await i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });
  // STATE__________________________________________________
  const state = {
    lng: defaultLanguage,
    form: {
      state: '',
    },
    feedLoad: '',
    error: '',
    urls: [],
  };
  // VALIDATION_________________________________________________
  const validate = (data) => yup
    .string()
    .url('invalidUrl')
    .required('requiredString')
    .notOneOf(state.urls, 'alreadyHasUrl')
    .validate(data);

  const formStateHandler = (value) => {
    switch (value) {
      case 'loading':
        feedbackRender(value);
        break;
      case 'feed.loaded':
        feedsRender(currentData.data);
        postsRender(currentData.data);
        feedbackRender(value);
        break;
      // case 'form.invalid':
      //  feedbackRender(value);
      //   break;
      case 'form.exist':
        feedbackRender(value);
        break;
      // case 'valid':
      //   feedLoad(watchedState);
      //   break;
      default:
        break;
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.state':
        formStateHandler(value, watchedState);
        break;
      case 'error':
        feedbackRender(value);
        break;
      default:
        break;
    }
  });
  // LISTENER_____________________________________________
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.form.state = 'loading';
    validate(url).then(() => {
      axios.get(getQueryString(url))
        .then((response) => {
          const content = response.data.contents;
          const data = parser(content);
          if (!data.errors) {
            currentData.data = data;
            watchedState.form.state = 'feed.loaded';
            state.urls.push(url);
            // console.log(state.urls)
            listsDb.push(data.postsList);
          } else {
            watchedState.error = 'feed.noRss';
          }
        })
        .catch(() => {
          // state.urls.shift();
          watchedState.error = 'feed.networkError';
          // console.log(urls);
        });
    })
      .catch((err) => {
        if (err.message === 'invalidUrl') {
          watchedState.error = 'form.invalid';
        }
        if (err.message === 'alreadyHasUrl') {
          watchedState.error = 'form.exist';
        }
      });
  });
  postsUpdate(watchedState, state.urls);
};
