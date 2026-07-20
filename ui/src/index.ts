import { definePlugin } from "@halo-dev/console-shared";
import { markRaw } from "vue";
import { initTheme } from "./composables/useTheme";
import Dashboard from "./views/Dashboard.vue";

// Initialize theme system
initTheme();
import Pomodoro from "./views/Pomodoro.vue";
import Habits from "./views/Habits.vue";
import Tasks from "./views/Tasks.vue";
import Statistics from "./views/Statistics.vue";
import Settings from "./views/Settings.vue";

export default definePlugin({
  components: {},
  routes: [
    {
      parentName: "Root",
      route: {
        path: "/habit-tracker",
        children: [
          {
            path: "",
            name: "HabitDashboard",
            component: markRaw(Dashboard),
            meta: {
              title: "仪表盘",
              searchable: true,
              menu: {
                name: "仪表盘",
                group: "tool",
                icon: "dashboard",
                priority: 50,
              },
            },
          },
          {
            path: "pomodoro",
            name: "HabitPomodoro",
            component: markRaw(Pomodoro),
            meta: {
              title: "番茄钟",
              searchable: true,
              menu: {
                name: "番茄钟",
                group: "tool",
                icon: "timer",
                priority: 51,
              },
            },
          },
          {
            path: "habits",
            name: "HabitHabits",
            component: markRaw(Habits),
            meta: {
              title: "习惯打卡",
              searchable: true,
              menu: {
                name: "习惯打卡",
                group: "tool",
                icon: "check-circle",
                priority: 52,
              },
            },
          },
          {
            path: "tasks",
            name: "HabitTasks",
            component: markRaw(Tasks),
            meta: {
              title: "任务管理",
              searchable: true,
              menu: {
                name: "任务管理",
                group: "tool",
                icon: "task",
                priority: 53,
              },
            },
          },
          {
            path: "stats",
            name: "HabitStats",
            component: markRaw(Statistics),
            meta: {
              title: "数据统计",
              searchable: true,
              menu: {
                name: "数据统计",
                group: "tool",
                icon: "chart",
                priority: 54,
              },
            },
          },
          {
            path: "settings",
            name: "HabitSettings",
            component: markRaw(Settings),
            meta: {
              title: "设置",
              searchable: true,
              menu: {
                name: "设置",
                group: "tool",
                icon: "settings",
                priority: 55,
              },
            },
          },
        ],
      },
    },
  ],
});
