package com.techmart.dto;

import jakarta.validation.constraints.Size;

public class UserSearchRequest {

    @Size(max = 100, message = "Search term must not exceed 100 characters")
    private String searchTerm;

    private String sortBy = "username";
    private String sortDirection = "ASC";
    private int page = 0;
    private int size = 20;

    public UserSearchRequest() {
    }

    public UserSearchRequest(String searchTerm) {
        this.searchTerm = searchTerm;
    }

    public String getSearchTerm() {
        return searchTerm;
    }

    public void setSearchTerm(String searchTerm) {
        this.searchTerm = searchTerm;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}
