<template>
  <div class="user-dashboard">
    <h1>{{ greeting }}</h1>

    <div class="search-bar">
      <input v-model="searchQuery" placeholder="Search users..." />
      <span>{{ searchQuery | capitalize }}</span>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span>Total: {{ totalUsers }}</span>
        <span>Active: {{ activeCount }}</span>
        <span>Last updated: {{ lastUpdated | formatDate }}</span>
      </div>
    </div>

    <table class="user-table">
      <thead>
        <tr>
          <th @click="sortBy('name')">Name {{ sortIcon('name') }}</th>
          <th @click="sortBy('email')">Email {{ sortIcon('email') }}</th>
          <th @click="sortBy('role')">Role {{ sortIcon('role') }}</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email | lowercase }}</td>
          <td>{{ user.role | capitalize }}</td>
          <td>
            <span :class="statusClass(user)">
              {{ user.active ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td>
            <button @click="editUser(user)">Edit</button>
            <button @click="confirmDelete(user)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <user-edit-modal
      v-if="editingUser"
      :user="editingUser"
      @save="onUserSaved"
      @close="editingUser = null"
    />
  </div>
</template>

<script>
import { EventBus } from '@/event-bus';
import paginationMixin from '@/mixins/pagination';
import sortMixin from '@/mixins/sort';

export default {
  name: 'UserDashboard',

  mixins: [paginationMixin, sortMixin],

  filters: {
    capitalize(value) {
      if (!value) return '';
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
    lowercase(value) {
      if (!value) return '';
      return value.toLowerCase();
    },
    formatDate(value) {
      if (!value) return '';
      const d = new Date(value);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },

  props: {
    initialUsers: {
      type: Array,
      default: () => [],
    },
    apiEndpoint: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      users: [],
      searchQuery: '',
      editingUser: null,
      lastUpdated: null,
      pollingInterval: null,
    };
  },

  computed: {
    greeting() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    },

    totalUsers() {
      return this.users.length;
    },

    activeCount() {
      return this.users.filter((u) => u.active).length;
    },

    filteredUsers() {
      let result = this.users;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        result = result.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
      }
      // Uses sortMixin's sortedData method
      result = this.sortedData(result);
      // Uses paginationMixin's paginatedData method
      result = this.paginatedData(result);
      return result;
    },
  },

  watch: {
    initialUsers: {
      immediate: true,
      handler(newVal) {
        this.users = [...newVal];
      },
    },
    searchQuery() {
      this.resetPagination(); // from paginationMixin
    },
  },

  created() {
    EventBus.$on('user-updated', this.handleUserUpdated);
    EventBus.$on('user-deleted', this.handleUserDeleted);
    EventBus.$on('refresh-users', this.fetchUsers);
  },

  mounted() {
    this.fetchUsers();
    this.pollingInterval = setInterval(this.fetchUsers, 30000);
  },

  beforeDestroy() {
    EventBus.$off('user-updated', this.handleUserUpdated);
    EventBus.$off('user-deleted', this.handleUserDeleted);
    EventBus.$off('refresh-users', this.fetchUsers);
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  },

  methods: {
    async fetchUsers() {
      try {
        const response = await this.$http.get(this.apiEndpoint);
        this.users = response.data;
        this.lastUpdated = new Date().toISOString();
      } catch (err) {
        this.$toast.error('Failed to load users');
      }
    },

    editUser(user) {
      this.editingUser = { ...user };
    },

    async onUserSaved(updatedUser) {
      const index = this.users.findIndex((u) => u.id === updatedUser.id);
      if (index !== -1) {
        this.$set(this.users, index, updatedUser);
      }
      this.editingUser = null;
      EventBus.$emit('user-updated', updatedUser);
    },

    async confirmDelete(user) {
      if (!confirm(`Delete ${user.name}?`)) return;
      try {
        await this.$http.delete(`${this.apiEndpoint}/${user.id}`);
        this.users = this.users.filter((u) => u.id !== user.id);
        EventBus.$emit('user-deleted', user.id);
        this.$toast.success(`${user.name} deleted`);
      } catch (err) {
        this.$toast.error('Failed to delete user');
      }
    },

    handleUserUpdated(user) {
      const index = this.users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        this.$set(this.users, index, user);
      }
    },

    handleUserDeleted(userId) {
      this.users = this.users.filter((u) => u.id !== userId);
    },

    statusClass(user) {
      return {
        'status-badge': true,
        'status-active': user.active,
        'status-inactive': !user.active,
      };
    },
  },
};
</script>
