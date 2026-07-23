package com.miaohaha.habit;

import com.miaohaha.habit.model.CheckIn;
import com.miaohaha.habit.model.Habit;
import com.miaohaha.habit.model.Pomodoro;
import com.miaohaha.habit.model.Task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import run.halo.app.extension.SchemeManager;
import run.halo.app.plugin.BasePlugin;
import run.halo.app.plugin.PluginContext;

@Slf4j
@Component
public class HabitPlugin extends BasePlugin {

    private final SchemeManager schemeManager;

    public HabitPlugin(PluginContext pluginContext, SchemeManager schemeManager) {
        super(pluginContext);
        this.schemeManager = schemeManager;
    }

    @Override
    public void start() {
        registerSafely(Habit.class);
        registerSafely(CheckIn.class);
        registerSafely(Pomodoro.class);
        registerSafely(Task.class);
        log.info("自律打卡插件已启动");
    }

    @Override
    public void stop() {
        log.info("自律打卡插件已停止");
    }

    private void registerSafely(Class<? extends run.halo.app.extension.Extension> type) {
        try {
            schemeManager.register(type);
            log.info("已注册自定义模型: {}", type.getSimpleName());
        } catch (Exception e) {
            log.warn("注册自定义模型 {} 失败: {}", type.getSimpleName(), e.getMessage());
        }
    }
}
