package com.miaohaha.habit.service;

import com.miaohaha.habit.model.Task;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final ReactiveExtensionClient client;

    public Mono<List<Task>> listAll() {
        return client.list(Task.class, null, null)
            .sort(Comparator.comparing((Task t) -> {
                Integer order = t.getSpec().getSortOrder();
                return order != null ? order : Integer.MAX_VALUE;
            }))
            .collectList();
    }

    public Mono<Task> getByName(String name) {
        return client.fetch(Task.class, name);
    }

    public Mono<Task> create(Task task) {
        if (task.getMetadata().getName() == null || task.getMetadata().getName().isBlank()) {
            task.getMetadata().setName(UUID.randomUUID().toString());
        }
        if (task.getSpec().getStatus() == null) {
            task.getSpec().setStatus(Task.TaskStatus.TODO);
        }
        if (task.getSpec().getPriority() == null) {
            task.getSpec().setPriority(Task.TaskPriority.MEDIUM);
        }
        if (task.getSpec().getPomodoroCount() == null) {
            task.getSpec().setPomodoroCount(0);
        }
        if (task.getSpec().getEstimatedPomos() == null) {
            task.getSpec().setEstimatedPomos(1);
        }
        task.getSpec().setCreatedAt(java.time.Instant.now());
        task.getSpec().setUpdatedAt(java.time.Instant.now());
        // Auto-assign sortOrder at end of list
        return client.list(Task.class, null, null)
            .map(t -> t.getSpec().getSortOrder())
            .defaultIfEmpty(0)
            .collectList()
            .flatMap(orders -> {
                int maxOrder = orders.stream().filter(o -> o != null).mapToInt(Integer::intValue).max().orElse(0);
                task.getSpec().setSortOrder(maxOrder + 1);
                return client.create(task);
            });
    }

    public Mono<Void> reorder(List<Map<String, Object>> items) {
        return Flux.fromIterable(items)
            .flatMap(item -> {
                String name = (String) item.get("name");
                Integer sortOrder = item.get("sortOrder") != null
                    ? ((Number) item.get("sortOrder")).intValue() : 0;
                return client.fetch(Task.class, name)
                    .flatMap(t -> {
                        if (t.getSpec() == null) {
                            return Mono.<Void>empty();
                        }
                        t.getSpec().setSortOrder(sortOrder);
                        t.getSpec().setUpdatedAt(java.time.Instant.now());
                        return client.update(t).then();
                    });
            })
            .then();
    }

    public Mono<Task> update(String name, Task updated) {
        return client.fetch(Task.class, name)
            .flatMap(existing -> {
                if (updated.getSpec().getTitle() != null) {
                    existing.getSpec().setTitle(updated.getSpec().getTitle());
                }
                if (updated.getSpec().getPriority() != null) {
                    existing.getSpec().setPriority(updated.getSpec().getPriority());
                }
                if (updated.getSpec().getStatus() != null) {
                    existing.getSpec().setStatus(updated.getSpec().getStatus());
                }
                if (updated.getSpec().getEstimatedPomos() != null) {
                    existing.getSpec().setEstimatedPomos(updated.getSpec().getEstimatedPomos());
                }
                if (updated.getSpec().getSortOrder() != null) {
                    existing.getSpec().setSortOrder(updated.getSpec().getSortOrder());
                }
                existing.getSpec().setUpdatedAt(java.time.Instant.now());
                return client.update(existing);
            });
    }

    public Mono<Task> incrementPomodoro(String name) {
        return client.fetch(Task.class, name)
            .flatMap(t -> {
                t.getSpec().setPomodoroCount(t.getSpec().getPomodoroCount() + 1);
                return client.update(t);
            });
    }

    public Mono<Task> delete(String name) {
        return client.fetch(Task.class, name)
            .flatMap(client::delete)
            .thenReturn(null);
    }
}
