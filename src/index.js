import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';

const regexp = /^.+\.rss(\.xml)?$/;

const rssSchema = yup.string().url().test(
  'is-valid',
  'url is not rss',
  (value) => regexp.test(value),
);

const state = {
  form: {
    valid: true,
  },
};

const form = document.querySelector('form');
const input = document.querySelector('input[name="name"]');

const watchedState = onChange(state, (path, value) => {
  if (path === 'form.valid') {
    if (value === false) {
      input.classList.add('is-invalid');
    }
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const feed = formData.get('name');
  // console.log(rssSchema.isValid(feed));
  rssSchema.isValid(feed)
    .then((res) => {
    if(!res) watchedState.form.valid = false;
  });
});
