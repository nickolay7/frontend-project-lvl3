import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

const regexp = /^.+\.rss(\.xml)?$/;

const rssSchema = yup.string().url().test(
  'is-valid',
  'url is not rss',
  (value) => regexp.test(value),
);

const state = {
  form: {
    valid: true,
    processError: '',
  },
  currentData: '',
  feeds: [],
};

const form = document.querySelector('form');
const input = document.querySelector('input[name="url"]');
const feeds = document.querySelector('.feeds');
const feedback = document.querySelector('.feedback');

const render = (doc) => {
  form.reset();
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  const h3 = document.createElement('h3');
  const p = document.createElement('p');
  ul.classList.add('list-group', 'mb-5');
  li.classList.add('list-group-item');
  feedback.classList.add('text-success');
  h2.textContent = 'Фиды';
  h3.textContent = doc.querySelector('title').textContent;
  p.textContent = doc.querySelector('description').textContent;
  feedback.textContent = 'RSS успешно загружен';
  li.appendChild(p);
  li.appendChild(h3);
  ul.appendChild(li);
  feeds.appendChild(h2);
  feeds.appendChild(ul);
};

const watchedState = onChange(state, (path, value) => {
  if (path === 'form.valid') {
    value ? input.classList.add('is-invalid') : input.classList.remove('is-invalid');
  }
  if (path === 'currentData') {
    render(state.currentData);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const feed = formData.get('url');
  rssSchema.isValid(feed)
    .then((res) => {
      if (!res || state.feeds.includes(feed)) {
        watchedState.form.valid = false;
      } else {
        state.feeds.push(feed);
        // watchedState.currentFeed = feed;
        watchedState.form.valid = res;
        console.log(state);
        axios.get(feed)
          .then((response) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.data, "application/xml");
            watchedState.currentData = doc;
          })
          .catch ((err) => {
          watchedState.form.processError = 'Error!';
          throw err;
        });
      }
    });
});
