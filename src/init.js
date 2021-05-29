import i18next from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import * as yup from 'yup';
// import _ from 'lodash';
import resources from './locales/index.js';
import parser from './parser.js';

const getQueryString = (data) => {
  const url = new URL('get', 'https://hexlet-allorigins.herokuapp.com');
  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', data);
  return url.toString();
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
  // STATE__________________________________________________
  const state = {
    lng: defaultLanguage,
    form: {
      state: '',
    },
    feedLoadingState: '',
    data: {
      urls: [],
      currentData: [],
      listsDb: [],
    },
  };
  // RENDER_______________________________________________
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

  const render = (message, data) => {
    form.reset();
    if (data) {
      const { title, description, postsList } = data;
      if (!feeds.querySelector('h2')) {
        const h2 = document.createElement('h2');
        const ul = document.createElement('ul');
        ul.classList.add('list-group', 'mb-5');
        h2.textContent = i18n.t('headers.feeds');
        feeds.appendChild(h2);
        feeds.appendChild(ul);
      }
      const feedsUl = feeds.querySelector('ul');
      const li = document.createElement('li');
      const h3 = document.createElement('h3');
      const p = document.createElement('p');
      li.classList.add('list-group-item');
      h3.textContent = title.textContent;
      p.textContent = description.textContent;
      li.appendChild(p);
      li.appendChild(h3);
      feedsUl.append(li);
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
      input.classList.remove('is-invalid');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t(message);
      submitButton.disabled = false;
      input.removeAttribute('readonly');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.classList.remove('text-success');
      submitButton.disabled = false;
      feedback.textContent = i18n.t(message);
      input.removeAttribute('readonly');
    }
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
        // const filtered = newPostsLists
        //   .map((items) => _.differenceBy([...items], watchedState.data.listsDb.flat(2), 'link'))
        //   .filter((el) => el.length !== 0);
        // if (filtered.length !== 0) {
        //   watchedState.data.listsDb.push(filtered);
        // }
        // state.data.currentData = filtered;
        const container = posts.querySelector('ul');
        const newUl = document.createElement('ul');
        if (container) {
          newPostsLists.forEach((item) => addPosts(newUl, item));
          container.replaceWith(newUl);
        }
      })
      .then(() => setTimeout(postsUpdate, 5000, watchedState, data));
  };
  // i18init_________________________________________________
  await i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });
  // VALIDATION_________________________________________________
  const validate = (data) => yup
    .string()
    .url('invalidUrl')
    .required('requiredString')
    .notOneOf(state.data.urls, 'urlAlreadyHas')
    .validate(data);
  // HANDLERS
  const feedLoadingHandler = (message) => {
    switch (message) {
      case 'loading':
        submitButton.disabled = true;
        input.setAttribute('readonly', 'readonly');
        break;
      case 'feed.loaded':
        render(message, state.data.currentData);
        // postsRender(message, state.data.currentData);
        break;
      case 'feed.noRss':
        render(message);
        break;
      case 'feed.networkError':
        render(message);
        break;
      default:
        break;
    }
  };
  // WATCHED_STATE
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.state':
        render(value);
        break;
      case 'feedLoadingState':
        feedLoadingHandler(value);
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
    watchedState.feedLoadingState = 'loading';
    validate(url).then(() => {
      axios.get(getQueryString(url))
        .then((response) => {
          const content = response.data.contents;
          const data = parser(content);
          if (!data.errors) {
            state.data.urls.push(url);
            watchedState.data.listsDb.push(data.postsList);
            watchedState.data.currentData = data;
            watchedState.feedLoadingState = 'feed.loaded';
          } else {
            watchedState.feedLoadingState = 'feed.noRss';
          }
        })
        .catch(() => {
          watchedState.feedLoadingState = 'feed.networkError';
        });
    })
      .catch((err) => {
        if (err.message === 'invalidUrl') {
          watchedState.form.state = 'form.invalid';
        }
        if (err.message === 'urlAlreadyHas') {
          watchedState.form.state = 'form.exist';
        }
      });
  });
  postsUpdate(watchedState, state.data.urls);
};
