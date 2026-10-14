/* Dated rule changes are authored data; all content is rendered as text. */
function changesGuide(main) {
  append(main, hero(
    'UNDERSTAND THE LATEST WORDING',
    '2026 changes & clarifications',
    'The February 2026 rulebook sets out the competition rules. World Aquatics’ commentary of 6 August 2026 explains or corrects selected clauses. Read each update and its application here, then open the related rule for the full requirement.'
  ));

  const dateParts = DATA.meta.verified.split('-').map(Number);
  const checked = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])));
  const overview = node('div', null, 'updates-overview');
  append(overview,
    node('p', 'Sources checked ' + checked, 'updates-checked'),
    node('p', 'Each label identifies the February rulebook, an August clarification or the status of 2027 rules. Application notes explain any difference between the latest World Aquatics guidance and the English position verified for this release.', 'updates-context')
  );
  main.append(overview);

  const updates = node('div', null, 'updates-grid');
  DATA.updates.forEach((update, index) => {
    const card = node('article', null, 'rule-card update-card' + (index === 0 ? ' update-featured' : ''));
    card.id = 'update-' + update.id;
    card.dataset.updateId = update.id;
    const headingId = card.id + '-title';
    card.setAttribute('aria-labelledby', headingId);

    const badge = node('span', update.label, 'update-badge');
    if (update.label.includes('August')) badge.classList.add('update-badge-clarification');
    if (update.label.includes('2027')) badge.classList.add('update-badge-future');
    const heading = node('h3', update.title);
    heading.id = headingId;
    append(card, badge, heading, node('p', update.summary, 'update-summary'));

    if (update.points.length) {
      const points = node('ul', null, 'update-points');
      for (const point of update.points) points.append(node('li', point));
      card.append(points);
    }

    if (update.scope) {
      const application = node('section', null, 'update-application');
      append(application, node('h4', 'Application'), node('p', update.scope));
      card.append(application);
    }

    if (update.relatedCodes.length) {
      const related = node('div', null, 'update-related');
      related.setAttribute('role', 'group');
      related.setAttribute('aria-label', 'Rules related to ' + update.title);
      related.append(node('p', 'Read the related rule', 'update-related-label'));
      const links = node('div', null, 'update-rule-links');
      for (const code of update.relatedCodes) {
        links.append(button('Rule ' + code, 'clause', code, 'button secondary update-rule-link'));
      }
      related.append(links);
      card.append(related);
    }

    if (update.refs.length) {
      const sources = node('details', null, 'update-sources');
      append(sources, node('summary', 'Official sources and dates'), refs(update));
      card.append(sources);
    }
    updates.append(card);
  });
  main.append(updates);
}
