import { hash } from 'rsvp';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import C from 'ui/utils/constants';

export default Route.extend({
  access:  service(),
  catalog: service(),
  scope:   service(),

  queryParams: {
    category: { refreshModel: true },
    catalogId: { refreshModel: true },
    templateBase: { refreshModel: true },
  },

  actions: {
    refresh: function() {
      // Clear the cache so it has to ask the server again
      this.set('cache', null);
      this.refresh();
    },
  },


  deactivate() {
    // Clear the cache when leaving the route so that it will be reloaded when you come back.
    this.set('cache', null);
  },

  beforeModel: function() {
    this._super(...arguments);

    return hash({
      namespaces: this.get('store').findAll('namespace'),
      catalogs: this.get('catalog').fetchCatalogs({
        headers: {
          [C.HEADER.PROJECT_ID]: this.get('scope.currentProject.id')
        },
      }),
    }).then((hash) => {
      this.set('catalogs', hash.catalogs);
      this.set('namespaces', hash.namespaces);
    });
  },

  model(params) {
    if (params.launchCluster) {
      params.plusInfra = true;
    } else {
      params.plusInfra = this.get('scope.currentProject.clusterOwner') === true;
    }

    let namespaces = this.get('namespaces');
    return this.get('catalog').fetchTemplates(params).then((res) => {
      res.catalog.forEach((tpl) => {
        let exists = namespaces.findBy('externalIdInfo.templateId', tpl.get('id'));
        tpl.set('exists', !!exists);
      });
      res.catalogs = this.get('catalogs');

      return res;
    });
  },

  resetController: function (controller, isExiting/*, transition*/) {
    if (isExiting)
    {
      controller.set('category', 'all');
      controller.set('templateBase', '');
    }
  }
});
