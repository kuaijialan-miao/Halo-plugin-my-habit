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
     kind = "Task",
     plural = "tasks",
     singular = "task")
public class Task extends AbstractExtension {

    private TaskSpec spec;

    @Data
    public static class TaskSpec {
        private String title;
        private TaskPriority priority;
        private TaskStatus status;
        private Integer pomodoroCount;
        private Integer estimatedPomos;
        private Instant createdAt;
        private Instant updatedAt;
    }

    public enum TaskPriority {
        HIGH,
        MEDIUM,
        LOW
    }

    public enum TaskStatus {
        TODO,
        IN_PROGRESS,
        DONE
    }
}
