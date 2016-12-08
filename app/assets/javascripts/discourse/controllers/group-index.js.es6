import { popupAjaxError } from 'discourse/lib/ajax-error';
import Group from 'discourse/models/group';
import { observes } from 'ember-addons/ember-computed-decorators';

export default Ember.Controller.extend({
  queryParams: ['order', 'asc'],
  order: 'last_posted_at',
  asc: null,
  loading: false,
  limit: null,
  offset: null,
  isOwner: Ember.computed.alias('model.is_group_owner'),

  @observes('order', 'asc')
  refreshMembers() {
    this.get('model') &&
      this.get('model').findMembers({ order: this.get('order'), asc: this.get('asc') });
  },

  actions: {
    removeMember(user) {
      this.get('model').removeMember(user);
    },

    addMembers() {
      const usernames = this.get('usernames');
      if (usernames && usernames.length > 0) {
        this.get('model').addMembers(usernames).then(() => this.set('usernames', [])).catch(popupAjaxError);
      }
    },

    loadMore() {
      if (this.get("loading")) { return; }
      if (this.get("model.members.length") >= this.get("model.user_count")) { return; }

      this.set("loading", true);

      Group.loadMembers(
        this.get("model.name"),
        this.get("model.members.length"),
        this.get("limit"),
        { order: this.get('order'), asc: this.get('asc') }
      ).then(result => {
        this.get("model.members").addObjects(result.members.map(member => Discourse.User.create(member)));
        this.setProperties({
          loading: false,
          user_count: result.meta.total,
          limit: result.meta.limit,
          offset: Math.min(result.meta.offset + result.meta.limit, result.meta.total)
        });
      });
    }
  }
});
