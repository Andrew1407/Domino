import { elementsContainer, listContainer, description, subheader } from '../../styles/CommandsList.module.scss';

const subListMapper = ([ key, value ]) => (
  typeof value === 'string' ?
    <div key={key} className={description}>
      <b>{key}</b>: {value}
    </div> :
    <div key={key}>
      <h3 className={subheader}>{key}:</h3>
      {Object.entries(value).map(subListMapper)}
    </div>
);

const listMapper = ([ title, entries ]) => (
  <div key={title} className={elementsContainer}>
    <h2>{title}:</h2>
    {Object.entries(entries).map(subListMapper)}
  </div>
);

export default function CommandsList({ entries }) {
  if (!entries) return (
    <div className={listContainer}>
      <h2>No commands fetched</h2>
    </div>
  );

  const list = JSON.parse(entries);
  
  return (
    <div className={listContainer}>
      {Object.entries(list).map(listMapper)}
    </div>
  );
};
