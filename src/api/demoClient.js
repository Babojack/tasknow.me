const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 1000;
const nextId = () => String(idCounter++);

const demoUserBase = {
  id: "1",
  full_name: "Demo User",
  email: "demo@example.com",
  user_type: "customer",
  city: "Berlin",
  latitude: 52.52,
  longitude: 13.405,
  onboarding_completed: true,
  role: "admin",
};

// Synced with AuthContext so demoApi.auth.me() returns the same role the user chose (Doer/Tasker).
let _currentUserType = "customer";
export function setDemoCurrentUserType(userType) {
  _currentUserType = userType;
  _currentUser.user_type = userType;
}
export function getDemoCurrentUserType() {
  return _currentUserType;
}

const _currentUser = { ...demoUserBase, user_type: _currentUserType };

const db = {
  users: [_currentUser],
  tasks: [
    {
      id: "t1",
      title: "Help with moving boxes",
      description: "Need help carrying boxes from car to apartment.",
      status: "open",
      is_live: true,
      owner_id: _currentUser.id,
      executor_id: null,
      price: 40,
      estimated_duration_minutes: 60,
      latitude: 52.52,
      longitude: 13.405,
      address: "Berlin",
      category: "move",
      asap_premium_percent: 0,
      asap_radius_meters: 500,
      asap_duration_seconds: 120,
      created_date: new Date().toISOString(),
    },
  ],
  messages: [],
  applications: [],
  blogPosts: [
    {
      id: "b1",
      title: "Welcome to TaskNow Demo",
      slug: "welcome-tasknow-demo",
      content: "This is a demo blog post with example text.",
      status: "published",
      created_date: new Date().toISOString(),
    },
  ],
  todoItems: [],
  reviews: [],
  verificationRequests: [],
};

const sortByField = (items, sort) => {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    if (av > bv) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
};

const matchesQuery = (item, query) => {
  if (!query) return true;
  return Object.entries(query).every(([key, value]) => {
    if (Array.isArray(value)) {
      return value.includes(item[key]);
    }
    return item[key] === value;
  });
};

const makeEntityApi = (collectionName) => ({
  async filter(query, sort) {
    await delay();
    const items = db[collectionName] || [];
    return sortByField(items.filter((it) => matchesQuery(it, query)), sort);
  },

  async list(sort) {
    await delay();
    const items = db[collectionName] || [];
    return sortByField(items, sort);
  },

  async create(data) {
    await delay();
    const item = { id: nextId(), ...data };
    db[collectionName].push(item);
    return item;
  },

  async update(id, data) {
    await delay();
    const items = db[collectionName];
    const index = items.findIndex((it) => String(it.id) === String(id));
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    return items[index];
  },

  async delete(id) {
    await delay();
    const items = db[collectionName];
    const index = items.findIndex((it) => String(it.id) === String(id));
    if (index !== -1) {
      items.splice(index, 1);
    }
    return { success: true };
  },

  async bulkCreate(list) {
    await delay();
    const created = list.map((data) => {
      const item = { id: nextId(), ...data };
      db[collectionName].push(item);
      return item;
    });
    return created;
  },
});

export const demoApi = {
  auth: {
    async me() {
      await delay();
      return { ..._currentUser };
    },
    async updateMe(data) {
      Object.assign(_currentUser, data);
      return { ..._currentUser };
    },
    async logout() {
      await delay();
      return { success: true };
    },
    async redirectToLogin() {
      return;
    },
  },
  entities: {
    User: makeEntityApi("users"),
    Task: makeEntityApi("tasks"),
    Message: makeEntityApi("messages"),
    TaskApplication: makeEntityApi("applications"),
    BlogPost: makeEntityApi("blogPosts"),
    TodoItem: makeEntityApi("todoItems"),
    Review: makeEntityApi("reviews"),
    VerificationRequest: makeEntityApi("verificationRequests"),
    Query: {
      async filter() {
        await delay();
        return [];
      },
    },
  },
  integrations: {
    Core: {
      async UploadFile() {
        await delay();
        return { file_url: "https://example.com/demo-file" };
      },
      async SendEmail() {
        await delay();
        return { success: true };
      },
      async SendSMS() {
        await delay();
        return { success: true };
      },
      async GenerateImage() {
        await delay();
        return { image_url: "https://via.placeholder.com/600x400" };
      },
      async ExtractDataFromUploadedFile() {
        await delay();
        return { text: "" };
      },
      async InvokeLLM() {
        await delay();
        return {};
      },
    },
  },
  appLogs: {
    async logUserInApp() {
      await delay();
      return { success: true };
    },
  },
};

