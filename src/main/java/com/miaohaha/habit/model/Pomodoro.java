package com.miaohaha.habit.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;
import java.time.Instant;

@Data
@EqualsAndHashCode(callSuper = true)
@GVK(group = "habit-tracker.miaohaha.com",
     version = "v1alpha1",
     kind = "Pomodoro",
     plural = "pomodoros",
     singular = "pomodoro")
public class Pomodoro extends AbstractExtension {

    private PomodoroSpec spec;

    @Data
    public static class PomodoroSpec {
        private String taskName;
        private Integer duration;
        private PomodoroMode mode;
        private Instant startTime;
        private Instant endTime;
    }

    public enum PomodoroMode {
        FOCUS,
        SHORT_BREAK,
        LONG_BREAK
    }
}
